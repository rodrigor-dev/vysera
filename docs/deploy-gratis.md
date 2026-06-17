# 🆓 Guia Completo: Vysera de Graça na Internet

Este guia ensina a subir o Vysera inteiro **sem gastar nada**, usando os tiers gratuitos das melhores plataformas.

## 📦 Stack Grátis

| Componente | Plataforma | Limites do Free Tier |
|-----------|------------|---------------------|
| Frontend (Next.js) | **Vercel** | 100GB banda, 6000 min de build/mês |
| Backend (Express) | **Render.com** | 750h/mês (dorme após 15min inatividade) |
| Banco (PostgreSQL) | **Supabase** | 500MB, 5GB banda, 2 projetos |
| Auth | **Supabase Auth** | 50k usuários/mês, 5k emails/mês |
| Storage | **Supabase Storage** | 1GB arquivos, 5GB banda |
| Redis (opcional) | **Upstash** | 10MB, 5k comandos/dia |
| Domínio | **Vercel + Render** | Subdomínios `.vercel.app` e `.onrender.com` |

---

## 🎯 Passo 1: Supabase (Banco + Auth + Storage)

### 1. Criar conta
1. Acesse [supabase.com](https://supabase.com)
2. Clique **Start your project** → login com GitHub
3. Crie uma **organization** (pode ser pessoal)
4. Clique **New project**
   - **Name:** `vysera`
   - **Database Password:** anote em lugar seguro
   - **Region:** escolha a mais próxima
   - **Pricing Plan:** **Free**
5. Aguarde ~2 minutos para provisionar

### 2. Pegar as chaves
No dashboard do projeto, vá em **Project Settings → API**:

```
Project URL: https://xxx.supabase.co         → NEXT_PUBLIC_SUPABASE_URL
anon public key: eyJ...                       → NEXT_PUBLIC_SUPABASE_ANON_KEY
service_role key: eyJ...                      → SUPABASE_SERVICE_ROLE_KEY
```

### 3. Pegar a string do banco
**Project Settings → Database → Connection string → URI**

```
postgresql://postgres:xxxxx@db.xxx.supabase.co:6543/postgres  → DATABASE_URL
```

> ⚠️ **Importante:** Na senha, substitua `@` por `%40` se houver!

### 4. Configurar Storage (para uploads)
1. Vá em **Storage → New bucket**
   - **Name:** `uploads`
   - **Public:** ON
2. Em **Storage → Policies**, clique em **New policy** no bucket `uploads`:
   - Escolha `Create a policy from scratch`
   - **Policy name:** `Allow uploads`
   - **Allowed operations:** SELECT, INSERT, DELETE
   - **Using expression:** `true` (para testes)

### 5. Configurar Auth (para OAuth)
1. Vá em **Authentication → Providers**
2. Ative **Email** (já vem ativo por padrão)
3. (Opcional) Configure Google, Apple, Facebook em cada provider

---

## 🎯 Passo 2: Deploy do Backend no Render

### 1. Preparar o código
Antes de tudo, vamos criar um arquivo que o Render vai usar pra iniciar:

```bash
# No backend/, crie ecosystem.config.js
```

**backend/ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'vysera-backend',
    script: 'dist/server.js',
    env: {
      NODE_ENV: 'production',
    },
  }],
};
```

### 2. Fazer deploy no Render
1. Acesse [render.com](https://render.com) e faça login com GitHub
2. Clique **New + → Web Service**
3. Conecte seu repositório GitHub
4. Configure:
   ```
   Name: vysera-backend
   Region: Oregon (ou o mais próximo)
   Branch: main
   Runtime: Node
   Build Command: cd backend && npm install && npm run build && npx prisma generate && npx prisma migrate deploy
   Start Command: cd backend && node dist/server.js
   Plan: Free
   ```
5. Clique **Advanced** e adicione as variáveis de ambiente:

| Variável | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render usa essa porta) |
| `DATABASE_URL` | (string do Supabase) |
| `JWT_SECRET` | `openssl rand -hex 64` (gere no terminal) |
| `JWT_REFRESH_SECRET` | `openssl rand -hex 64` |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `ENCRYPTION_KEY` | `openssl rand -hex 16` (32 chars) |
| `CORS_ORIGIN` | `https://vysera-frontend.vercel.app` |
| `SUPABASE_SERVICE_ROLE_KEY` | (do Supabase) |
| `UPLOAD_DIR` | `/opt/render/project/src/backend/uploads` |
| `BCRYPT_SALT_ROUNDS` | `12` |

6. Clique **Create Web Service**
7. Aguarde o build (~3-5 min)

> ⚠️ **Problema do Free Tier:** O Render free **dorme após 15 minutos** sem uso. A primeira requisição após o sono leva ~30s para acordar. Soluções:
> - Use [cron-job.org](https://cron-job.org) grátis para pingar a cada 10min
> - Crie um job que bate em `https://seu-backend.onrender.com/api/health` a cada 10 min

### 3. URL do Backend
Após o deploy: `https://vysera-backend.onrender.com`

---

## 🎯 Passo 3: Deploy do Frontend na Vercel

### 1. Conectar repositório
1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique **Add New → Project**
3. Importe o repositório do Vysera
4. Configure:
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: (deixar padrão - next build)
   Output Directory: (deixar padrão - .next)
   ```

### 2. Variáveis de ambiente
Clique **Environment Variables** e adicione:

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | (do Supabase) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (do Supabase) |
| `NEXT_PUBLIC_API_URL` | `https://vysera-backend.onrender.com/api` |

### 3. Deploy
Clique **Deploy** e aguarde ~2 minutos.

### 4. URL do Frontend
Após o deploy: `https://vysera-frontend.vercel.app`

> ⚠️ **Atualize o CORS** no Render: volte no backend e mude `CORS_ORIGIN` para `https://vysera-frontend.vercel.app`

---

## 🎯 Passo 4: Seed do Banco

Após o backend estar rodando, precisamos popular o banco:

### Opção A: Via Render Shell
1. No Render dashboard, vá em seu Web Service
2. Clique **Shell** (acima dos logs)
3. Execute:
```bash
cd backend
npx prisma db seed
```

### Opção B: Local (seu computador)
```bash
# No seu terminal (com a DATABASE_URL do Supabase no .env)
cd backend
npx prisma db seed
```

### Contas criadas pelo seed:

| Papel | Email | Senha |
|-------|-------|-------|
| 👑 Admin | admin@vysera.com | Admin@123456 |
| ⭐ Pro | pro@vysera.com | User@123456 |
| 🆓 Free | user@vysera.com | User@123456 |

---

## 🎯 Passo 5: (Opcional) Configurar Stripe

Para cobrar clientes, você precisa do Stripe:

1. Acesse [stripe.com](https://stripe.com) e crie conta
2. Vá em **Developers → API keys**
   - Copie `sk_test_...` → `STRIPE_SECRET_KEY`
   - Copie `pk_test_...` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Vá em **Developers → Webhooks → Add endpoint**
   - **Endpoint URL:** `https://vysera-backend.onrender.com/api/payments/webhook`
   - **Events to send:** `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copie o `Signing secret` (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`
4. Adicione essas variáveis no Render

---

## 🎯 Passo 6: (Opcional) Redis com Upstash

O Vysera funciona sem Redis (usa memória internamente), mas se quiser:

1. Acesse [upstash.com](https://upstash.com)
2. Crie um database **Redis** grátis (10MB)
3. Copie as credenciais:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Adicione no Render

---

## 🆓 Alternativas Grátis

Se alguma plataforma não funcionar, aqui estão alternativas:

### Backend
| Plataforma | Prós | Contras |
|-----------|------|---------|
| **Render.com** | Fácil, template Node | Dorme após 15min inativo |
| **Fly.io** | Não dorme, 3 VMs grátis | Configuração mais complexa |
| **Railway** | Rápido, bom template | $5 crédito (acaba) |
| **Koyeb** | Não dorme, 1 app grátis | Menos documentado |

#### Fly.io (alternativa ao Render)

```bash
# Instalar flyctl
npm i -g flyctl
flyctl auth login

# Configurar
cd backend
fly launch --name vysera-backend
fly secrets set DATABASE_URL=... JWT_SECRET=... JWT_REFRESH_SECRET=... ENCRYPTION_KEY=... CORS_ORIGIN=...
fly deploy
```

### Banco de Dados
| Plataforma | Limites |
|-----------|---------|
| **Supabase** | 500MB, 2 projetos |
| **Neon** | 500MB, branchless |
| **Railway** | $5 crédito, PostgreSQL |
| **Aiven** | 5GB grátis (1 projeto) |

### Frontend
| Plataforma | Prós |
|-----------|------|
| **Vercel** | Feito pra Next.js, mais fácil |
| **Netlify** | Suporte Next.js também |
| **Cloudflare Pages** | Muito rápido, 500k requests/mês |

---

## ⚡ Script de Deploy Automático

Crie este arquivo na raiz do projeto:

**deploy.sh:**
```bash
#!/bin/bash
# ============================================
# VYSERA DEPLOY SCRIPT
# ============================================
# Usage: ./deploy.sh
# ============================================

echo "🚀 Iniciando deploy do Vysera..."
echo ""

# 1. Push para o GitHub (gatilho para Render + Vercel)
echo "📤 Enviando para GitHub..."
git add .
git commit -m "deploy: $(date +'%Y-%m-%d %H:%M')"
git push origin main

echo ""
echo "✅ Código enviado! O deploy automático vai acontecer em:"
echo "   Frontend: https://vercel.com (deploy automático)"
echo "   Backend:  https://dashboard.render.com (deploy automático)"
echo ""
echo "⏱️  Aguarde ~3 minutos e acesse:"
echo "   https://vysera-frontend.vercel.app"
```

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## ✅ Checklist de Verificação

Após o deploy, verifique:

```bash
# 1. Backend está vivo?
curl https://vysera-backend.onrender.com/api/health

# 2. Frontend está no ar?
curl https://vysera-frontend.vercel.app

# 3. Login funciona?
curl -X POST https://vysera-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vysera.com","password":"Admin@123456"}'

# 4. Banco tem dados?
curl https://vysera-backend.onrender.com/api/admin/stats \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"
```

---

## 🐛 Problemas Comuns

### ❌ Backend não conecta ao banco
**Solução:** Verifique se a `DATABASE_URL` está correta. No Supabase, use a string **URI** (não a URL do projeto).

### ❌ CORS bloqueando requisições
**Solução:** Atualize `CORS_ORIGIN` no Render para a URL exata do seu frontend na Vercel.

### ❌ Upload de arquivos falhando
**Solução:** No Render free tier, o disco é **efêmero** — arquivos enviados são perdidos quando o serviço reinicia. Para produção, use **Supabase Storage**:
1. Em `backend/.env`: mude `UPLOAD_DIR` para usar Supabase Storage
2. Ou configure `UPLOAD_DIR` para `/tmp/uploads` que é persistente durante o ciclo de vida

### ❌ Build falhando no Render
**Solução:** Aumente o tempo de build (Settings → Build & Deploy → Auto Deploy timeout) ou use o plano pago ($7/mês acelera build).

### ❌ Prisma Client não encontrado
**Solução:** Certifique-se que `npx prisma generate` está no Build Command do Render.

---

## 💰 Upgrade: Quando Vale a Pena Pagar?

| Situação | Plano Recomendado |
|----------|-------------------|
| Só você usando | **Free Stack** (tudo grátis) |
| 5-10 usuários | Render **$7/mês** (não dorme) |
| 50+ usuários | Render **$7 + Supabase Pro $25** |
| Produção séria | Fly.io **$~$15/mês** (não dorme + SSD) |

---

## 🎉 Conclusão

Com este guia, você tem:
- ✅ Frontend no **Vercel** (rápido, global)
- ✅ Backend no **Render** (funcional, mas dorme)
- ✅ Banco no **Supabase** (robusto, 500MB grátis)
- ✅ Auth + Storage no Supabase
- ✅ CI/CD automático (push no GitHub = deploy automático)

**Custo total: R$ 0,00 / mês** ☁️✨
