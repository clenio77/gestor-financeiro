-- Migration: Financial Goals System
-- Description: Sistema completo de metas financeiras com IA e alertas

-- Tabela de metas financeiras
CREATE TABLE financial_goals (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(12,2) DEFAULT 0 CHECK (current_amount >= 0),
  target_date DATE,
  category VARCHAR(100) NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  goal_type VARCHAR(30) DEFAULT 'savings' CHECK (goal_type IN ('savings', 'debt_payment', 'investment', 'expense_reduction', 'income_increase')),
  auto_contribute BOOLEAN DEFAULT false,
  auto_contribute_amount DECIMAL(10,2),
  auto_contribute_frequency VARCHAR(20) CHECK (auto_contribute_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Índices para performance
  CONSTRAINT fk_financial_goals_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Tabela de contribuições para metas
CREATE TABLE goal_contributions (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER NOT NULL REFERENCES financial_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  contribution_date DATE DEFAULT CURRENT_DATE,
  description TEXT,
  transaction_id INTEGER REFERENCES transactions(id),
  is_automatic BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de alertas de metas
CREATE TABLE goal_alerts (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER NOT NULL REFERENCES financial_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('milestone', 'deadline_warning', 'off_track', 'completed', 'overdue')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de marcos/milestones das metas
CREATE TABLE goal_milestones (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER NOT NULL REFERENCES financial_goals(id) ON DELETE CASCADE,
  percentage INTEGER NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  amount DECIMAL(10,2) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  achieved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX idx_financial_goals_status ON financial_goals(status);
CREATE INDEX idx_financial_goals_target_date ON financial_goals(target_date);
CREATE INDEX idx_goal_contributions_goal_id ON goal_contributions(goal_id);
CREATE INDEX idx_goal_contributions_user_id ON goal_contributions(user_id);
CREATE INDEX idx_goal_alerts_user_id ON goal_alerts(user_id);
CREATE INDEX idx_goal_alerts_is_read ON goal_alerts(is_read);
CREATE INDEX idx_goal_milestones_goal_id ON goal_milestones(goal_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_financial_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_financial_goals_updated_at
  BEFORE UPDATE ON financial_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_goals_updated_at();

-- Trigger para atualizar current_amount quando há contribuições
CREATE OR REPLACE FUNCTION update_goal_current_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE financial_goals 
    SET current_amount = current_amount + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.goal_id;
    
    -- Verificar se a meta foi atingida
    UPDATE financial_goals 
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = NEW.goal_id 
      AND current_amount >= target_amount 
      AND status = 'active';
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE financial_goals 
    SET current_amount = current_amount - OLD.amount,
        updated_at = NOW()
    WHERE id = OLD.goal_id;
    
    -- Reativar meta se estava completa e agora não está mais
    UPDATE financial_goals 
    SET status = 'active',
        completed_at = NULL
    WHERE id = OLD.goal_id 
      AND current_amount < target_amount 
      AND status = 'completed';
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_goal_current_amount
  AFTER INSERT OR DELETE ON goal_contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_current_amount();

-- Trigger para criar marcos automáticos
CREATE OR REPLACE FUNCTION create_goal_milestones()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar marcos de 25%, 50%, 75% e 100%
  INSERT INTO goal_milestones (goal_id, percentage, amount, title)
  VALUES 
    (NEW.id, 25, NEW.target_amount * 0.25, '25% da meta atingida'),
    (NEW.id, 50, NEW.target_amount * 0.50, '50% da meta atingida'),
    (NEW.id, 75, NEW.target_amount * 0.75, '75% da meta atingida'),
    (NEW.id, 100, NEW.target_amount, 'Meta completada!');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_goal_milestones
  AFTER INSERT ON financial_goals
  FOR EACH ROW
  EXECUTE FUNCTION create_goal_milestones();

-- Trigger para verificar marcos atingidos
CREATE OR REPLACE FUNCTION check_milestone_achievements()
RETURNS TRIGGER AS $$
DECLARE
  milestone_record RECORD;
BEGIN
  -- Verificar marcos não atingidos
  FOR milestone_record IN 
    SELECT * FROM goal_milestones 
    WHERE goal_id = NEW.goal_id 
      AND achieved_at IS NULL 
      AND NEW.amount >= amount
  LOOP
    -- Marcar marco como atingido
    UPDATE goal_milestones 
    SET achieved_at = NOW() 
    WHERE id = milestone_record.id;
    
    -- Criar alerta de marco atingido
    INSERT INTO goal_alerts (goal_id, user_id, alert_type, title, message, severity)
    VALUES (
      NEW.goal_id,
      NEW.user_id,
      'milestone',
      'Marco atingido! 🎉',
      'Parabéns! Você atingiu ' || milestone_record.percentage || '% da sua meta "' || 
      (SELECT title FROM financial_goals WHERE id = NEW.goal_id) || '"',
      'success'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_milestone_achievements
  AFTER INSERT ON goal_contributions
  FOR EACH ROW
  EXECUTE FUNCTION check_milestone_achievements();

-- RLS (Row Level Security)
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own financial goals" ON financial_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own financial goals" ON financial_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial goals" ON financial_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial goals" ON financial_goals
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own goal contributions" ON goal_contributions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goal contributions" ON goal_contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goal contributions" ON goal_contributions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goal contributions" ON goal_contributions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own goal alerts" ON goal_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own goal alerts" ON goal_alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view milestones of their goals" ON goal_milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM financial_goals 
      WHERE id = goal_milestones.goal_id 
        AND user_id = auth.uid()
    )
  );

-- Inserir dados de exemplo (opcional)
-- INSERT INTO financial_goals (user_id, title, description, target_amount, category, target_date, goal_type)
-- VALUES 
--   (auth.uid(), 'Reserva de Emergência', 'Guardar 6 meses de gastos', 30000.00, 'Emergência', '2024-12-31', 'savings'),
--   (auth.uid(), 'Viagem para Europa', 'Economizar para viagem dos sonhos', 15000.00, 'Lazer', '2024-07-01', 'savings');

COMMENT ON TABLE financial_goals IS 'Metas financeiras dos usuários com IA e automação';
COMMENT ON TABLE goal_contributions IS 'Contribuições para as metas financeiras';
COMMENT ON TABLE goal_alerts IS 'Alertas inteligentes sobre metas';
COMMENT ON TABLE goal_milestones IS 'Marcos e conquistas das metas';
