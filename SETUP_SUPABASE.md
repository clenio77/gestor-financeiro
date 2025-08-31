# 🚀 Configuração do Supabase - Guia Completo

Este guia te ajudará a configurar o Supabase para o Gestor Financeiro Next.js.

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- Chaves de API (OpenAI e Google AI) para funcionalidades de IA

## 🛠️ Passo 1: Criar Projeto no Supabase

1. **Acesse** [supabase.com](https://supabase.com)
2. **Clique** em "Start your project"
3. **Crie** uma nova organização (se necessário)
4. **Clique** em "New Project"
5. **Preencha**:
   - Nome: `gestor-financeiro`
   - Database Password: (gere uma senha forte)
   - Region: `South America (São Paulo)` (recomendado para Brasil)
6. **Clique** em "Create new project"
7. **Aguarde** ~2 minutos para o projeto ser criado

## 🔑 Passo 2: Obter Chaves de API

1. **Vá** para Settings → API
2. **Copie** as seguintes informações:
   - **Project URL**: `https://seu-projeto.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (⚠️ Mantenha secreta!)

## 🗄️ Passo 3: Configurar Banco de Dados

1. **Vá** para SQL Editor
2. **Clique** em "New query"
3. **Cole** o conteúdo do arquivo `supabase/migrations/001_initial_schema.sql`
4. **Execute** a query (Ctrl+Enter ou botão Run)
5. **Verifique** se as tabelas foram criadas em Database → Tables

## 🔐 Passo 4: Configurar Autenticação

1. **Vá** para Authentication → Settings
2. **Configure**:
   - Site URL: `http://localhost:3000` (desenvolvimento)
   - Redirect URLs: `http://localhost:3000/**`
3. **Habilite** Email confirmations (opcional)
4. **Configure** Email templates (opcional)

## 🌍 Passo 5: Configurar Variáveis de Ambiente

1. **Copie** o arquivo `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```

2. **Edite** `.env.local` com suas chaves:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_privada_aqui

# AI Services
OPENAI_API_KEY=sk-sua_chave_openai_aqui
GOOGLE_AI_API_KEY=sua_chave_google_ai_aqui

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🤖 Passo 6: Configurar APIs de IA

### OpenAI API
1. **Acesse** [platform.openai.com](https://platform.openai.com)
2. **Vá** para API Keys
3. **Crie** uma nova chave
4. **Adicione** créditos à sua conta (mínimo $5)

### Google AI (Gemini)
1. **Acesse** [makersuite.google.com](https://makersuite.google.com)
2. **Clique** em "Get API Key"
3. **Crie** uma nova chave
4. **Copie** a chave gerada

## 🧪 Passo 7: Testar a Configuração

1. **Inicie** o servidor de desenvolvimento:
```bash
npm run dev
```

2. **Acesse** http://localhost:3000

3. **Teste** as funcionalidades:
   - ✅ Registro de usuário
   - ✅ Login
   - ✅ Dashboard
   - ✅ Criação de transações
   - ✅ OCR (se configurado Google AI)
   - ✅ Análise PDF (se configurado OpenAI)

## 🔧 Passo 8: Configurações Avançadas (Opcional)

### Row Level Security (RLS)
As políticas RLS já estão configuradas no schema. Elas garantem que:
- Usuários só veem seus próprios dados
- Dados são automaticamente filtrados por `user_id`

### Triggers Automáticos
O schema inclui triggers que:
- Atualizam `updated_at` automaticamente
- Calculam saldo das contas automaticamente

### Índices de Performance
Índices otimizados para:
- Consultas por usuário
- Ordenação por data
- Filtros por categoria e tipo

## 🚀 Deploy em Produção

### Vercel (Recomendado)
1. **Conecte** seu repositório GitHub à Vercel
2. **Configure** as variáveis de ambiente na Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `GOOGLE_AI_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (URL de produção)

3. **Atualize** as configurações do Supabase:
   - Site URL: `https://seu-app.vercel.app`
   - Redirect URLs: `https://seu-app.vercel.app/**`

## 🔍 Troubleshooting

### Erro: "Invalid API key"
- ✅ Verifique se as chaves estão corretas no `.env.local`
- ✅ Reinicie o servidor após alterar variáveis de ambiente

### Erro: "Row Level Security"
- ✅ Verifique se o usuário está autenticado
- ✅ Confirme que as políticas RLS foram criadas

### Erro: "CORS"
- ✅ Verifique as URLs configuradas no Supabase
- ✅ Confirme que está usando HTTPS em produção

### OCR/PDF não funciona
- ✅ Verifique se as chaves de IA estão configuradas
- ✅ Confirme que há créditos nas contas (OpenAI)
- ✅ Teste com arquivos pequenos primeiro

## 📊 Monitoramento

### Supabase Dashboard
- **Database**: Monitore uso e performance
- **Auth**: Veja usuários registrados
- **Storage**: Monitore uploads (se usar)
- **Logs**: Debug de erros

### Vercel Analytics
- **Performance**: Core Web Vitals
- **Usage**: Requests e bandwidth
- **Errors**: Logs de erro em produção

## 🎯 Próximos Passos

1. **Teste** todas as funcionalidades
2. **Configure** backup automático (Supabase Pro)
3. **Implemente** monitoramento de erros (Sentry)
4. **Configure** analytics (Mixpanel/Google Analytics)
5. **Otimize** performance com caching

---

**🎉 Parabéns! Seu Gestor Financeiro está configurado e pronto para uso!**

Para suporte, consulte:
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Next.js](https://nextjs.org/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
