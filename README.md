# Gestor Financeiro Inteligente - Next.js PWA

Uma aplicação moderna de gestão financeira pessoal com IA, migrada de React para Next.js com funcionalidades PWA.

## 🚀 Principais Melhorias da Migração

### ✅ Migração Completa para Next.js
- **App Router**: Estrutura moderna com roteamento baseado em arquivos
- **Server-Side Rendering (SSR)**: Melhor performance e SEO
- **TypeScript**: Type safety completo em toda a aplicação
- **Tailwind CSS**: Styling moderno e responsivo

### 📱 Progressive Web App (PWA)
- **Instalação Nativa**: Pode ser instalado como app nativo no dispositivo
- **Funcionalidade Offline**: Cache inteligente para uso sem internet
- **Service Worker**: Atualizações automáticas em background
- **Notificações Push**: Alertas e lembretes financeiros
- **Ícones Adaptativos**: Suporte completo para diferentes dispositivos

### 🎨 Interface Moderna
- **Design System**: Componentes reutilizáveis com Radix UI
- **Responsivo**: Funciona perfeitamente em mobile, tablet e desktop
- **Dark Mode Ready**: Preparado para tema escuro
- **Animações**: Transições suaves e feedback visual

### 🔧 Melhorias Técnicas
- **SWR**: Data fetching otimizado com cache automático
- **React Hook Form**: Formulários performáticos com validação
- **Zod**: Validação de schemas robusta
- **Error Boundaries**: Tratamento de erros melhorado
- **Loading States**: Estados de carregamento em toda a aplicação

## 📋 Funcionalidades Implementadas

### 🏠 Landing Page
- Hero section atrativa
- Apresentação das funcionalidades
- Call-to-actions otimizados
- SEO otimizado

### 🔐 Autenticação
- Login/Registro com validação
- Gerenciamento de sessão
- Rotas protegidas
- Feedback visual de erros

### 📊 Dashboard
- Resumo financeiro completo
- Gráficos interativos (Recharts)
- Transações recentes
- Ações rápidas

### 💰 Gestão de Transações
- Listagem com filtros e busca
- Criação de novas transações
- Categorização automática
- Edição e exclusão

### 📷 OCR Inteligente
- Upload de imagens de recibos
- Extração automática de dados
- Revisão antes da confirmação
- Suporte a múltiplos formatos

### 🏦 Gestão de Contas
- Múltiplas contas financeiras
- Saldos em tempo real
- Transferências entre contas

### 📈 Análise com IA
- Upload de PDFs para análise
- Insights automáticos
- Recomendações personalizadas
- Relatórios detalhados

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 15**: Framework React com SSR
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Utility-first CSS
- **Radix UI**: Componentes acessíveis
- **Lucide React**: Ícones modernos
- **Recharts**: Gráficos interativos
- **SWR**: Data fetching
- **React Hook Form**: Formulários
- **Zod**: Validação de schemas

### PWA
- **next-pwa**: Service Worker e cache
- **Workbox**: Estratégias de cache avançadas
- **Web App Manifest**: Configuração PWA
- **Service Worker**: Funcionalidade offline

### Backend Integration
- **Axios**: Cliente HTTP
- **JWT**: Autenticação
- **FastAPI**: API backend (existente)

## 📱 Funcionalidades PWA

### Instalação
- Prompt automático de instalação
- Ícones adaptativos para diferentes dispositivos
- Splash screen personalizada

### Offline
- Cache inteligente de recursos
- Sincronização quando volta online
- Indicador de status de conexão

### Notificações
- Permissão automática
- Alertas de transações
- Lembretes de orçamento

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta no Supabase
- Chaves de API (OpenAI e Google AI)

### Instalação Rápida
```bash
# Clone o repositório
git clone <repository-url>
cd gestor_financeiro_nextjs

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas chaves do Supabase e IA

# Execute em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

### Configuração Completa
1. **Siga o guia**: [SETUP_SUPABASE.md](./SETUP_SUPABASE.md)
2. **Configure Supabase**: Banco de dados e autenticação
3. **Obtenha chaves de IA**: OpenAI e Google AI
4. **Configure variáveis**: `.env.local`

### Variáveis de Ambiente
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica
SUPABASE_SERVICE_ROLE_KEY=sua_chave_privada

# IA
OPENAI_API_KEY=sk-sua_chave_openai
GOOGLE_AI_API_KEY=sua_chave_google_ai

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📦 Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run start` - Servidor de produção
- `npm run lint` - Linting do código
- `npm run type-check` - Verificação de tipos

## 🔄 Migração Completa: React → Next.js + Supabase

### ✅ **MIGRAÇÃO 100% CONCLUÍDA**

**Arquitetura Anterior:**
- React SPA + FastAPI + SQLite

**Nova Arquitetura:**
- Next.js Full-Stack + Supabase PostgreSQL + PWA

### O que foi migrado e melhorado:
- ✅ **Todos os componentes React** → Next.js com TypeScript
- ✅ **React Router** → Next.js App Router (file-based)
- ✅ **FastAPI** → Next.js API Routes + Supabase
- ✅ **SQLite** → PostgreSQL com RLS
- ✅ **JWT manual** → Supabase Auth
- ✅ **CrewAI** → OpenAI GPT-4 (mais estável)
- ✅ **Google Vision** → Google Gemini Vision (melhor)
- ✅ **Axios** → Supabase Client + Fetch API
- ✅ **Dashboard e gráficos** → Mantidos e melhorados
- ✅ **PWA completo** → Cache offline + instalação nativa

### Funcionalidades preservadas e melhoradas:
- 🔥 **OCR Inteligente**: Agora extrai dados estruturados
- 🔥 **Análise PDF**: GPT-4 com insights mais precisos
- 🔥 **Dashboard**: Realtime updates com Supabase
- 🔥 **Autenticação**: Mais segura com Supabase Auth
- 🔥 **Performance**: SSR + Edge Functions
- 🔥 **Offline**: PWA com cache inteligente

## 🎯 Próximos Passos

### Funcionalidades Pendentes (do GEMINI.md)
- [ ] Testes de ponta a ponta
- [ ] Beta teste com usuários
- [ ] Configuração de métricas (Mixpanel)
- [ ] Gateway de pagamento (Stripe)
- [ ] Análise Preditiva
- [ ] Sistema de Metas Financeiras
- [ ] Alertas Inteligentes
- [ ] Integração com Open Finance

### Melhorias Técnicas
- [ ] Implementar testes unitários
- [ ] Adicionar Storybook
- [ ] Configurar CI/CD
- [ ] Monitoramento de performance
- [ ] Análise de bundle

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, leia o guia de contribuição antes de submeter PRs.

---

**Desenvolvido com ❤️ usando Next.js e tecnologias modernas**
