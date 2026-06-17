# 🚀 GUIA COMPLETO PARA INICIANTES: Colocando o Vysera no Ar

**Público:** Alguém que NUNCA fez deploy antes
**Tempo total:** ~1 hora
**Custo:** R$ 0,00

---

## 📌 O que você vai precisar

1. **Um computador** (qualquer um)
2. **Google Chrome** ou outro navegador
3. **Seu celular por perto** (vai receber SMS para confirmar contas)

---

## 🔰 PARTE 1: CRIAR AS CONTAS NECESSÁRIAS

### 1.1 Criar conta no GitHub

O GitHub é onde seu código vai ficar armazenado na nuvem.

1. Acesse **https://github.com/signup**
2. Digite seu **email**
3. Crie uma **senha**
4. Escolha um **nome de usuário** (ex: `joaosilva`)
5. Verifique seu email (você receberá um código)
6. Responda as perguntas:
   - "Quantas pessoas?" → **Just me**
   - "Student or teacher?" → **Nope**
   - "What features?" → pode pular
7. Escolha o plano **Free**

✅ Pronto! Sua conta no GitHub está criada.

### 1.2 Criar conta no Supabase (banco de dados)

1. Acesse **https://supabase.com**
2. Clique no botão **"Start your project"** (azul, no meio da tela)
3. Clique em **"Sign in with GitHub"**
4. Autorize o acesso (vai pedir seu login do GitHub)
5. Clique em **"Authorize supabase"**
6. Você será redirecionado de volta ao Supabase
7. Clique em **"New project"** (botão roxo, canto superior direito)
8. Preencha:
   - **Name:** `vysera` (ou outro nome)
   - **Database Password:** Crie uma senha forte e **ANOTE** (não esqueça!)
   - **Region:** Escolha `South America (São Paulo)` (mais perto = mais rápido)
   - **Pricing Plan:** **Free** (já vem selecionado)
9. Clique em **"Create new project"**
10. **Aguarde uns 2 minutos** enquanto o banco é criado

✅ Conta Supabase criada!

### 1.3 Criar conta no Render (para o backend)

1. Acesse **https://render.com**
2. Clique em **"Get started for free"**
3. Clique em **"Sign in with GitHub"**
4. Autorize (igual fez no Supabase)
5. Preencha seu **nome** e **telefone** (vai receber um SMS)
6. Digite o código recebido no celular
7. Pronto! Você está no dashboard do Render.

✅ Conta Render criada!

### 1.4 Criar conta na Vercel (para o frontend)

1. Acesse **https://vercel.com**
2. Clique em **"Sign Up"**
3. Clique em **"Continue with GitHub"**
4. Autorize o acesso
5. Pronto! Dashboard da Vercel.

✅ Conta Vercel criada!

---

## 🔰 PARTE 2: PREPARAR O REPOSITÓRIO NO GITHUB

Agora vamos enviar o código do Vysera para o GitHub.

### 2.1 Criar um repositório no GitHub

1. Acesse **https://github.com** e faça login
2. Clique no botão **"+"** (canto superior direito) → **"New repository"**
3. Preencha:
   - **Repository name:** `vysera`
   - **Description:** (deixe em branco)
   - **Public** ou **Private** (tanto faz)
   - **NÃO** marque "Add a README" (já temos)
   - **NÃO** marque ".gitignore" (já temos)
4. Clique em **"Create repository"**

### 2.2 Baixar Git e configurar

Se você NÃO tem o Git instalado:

1. Acesse **https://git-scm.com/downloads**
2. Baixe a versão para Windows e instale (next, next, next... tudo padrão)
3. Abra o **PowerShell** ou **Git Bash** (pesquise no menu Iniciar)

Configure seu nome e email no Git:
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com""
```

### 2.3 Enviar o código para o GitHub

Abra o terminal no diretório do Vysera:

```bash
# Navegue até a pasta do projeto
cd "C:\Users\rodri\OneDrive\Documentos\Vysera open code\vysera"

# Inicie o Git na pasta
git init

# Adicione todos os arquivos
git add .

# Crie o primeiro commit
git commit -m "primeiro commit - Vysera completo"

# Conecte ao seu repositório no GitHub
# (substitua SEU_USUARIO pelo seu nome de usuário do GitHub)
git remote add origin https://github.com/SEU_USUARIO/vysera.git

# Envie o código
git push -u origin main
```

> 🔴 **IMPORTANTE:** Quando der o `git push`, vai abrir uma janela do navegador pedindo login no GitHub. Faça o login e autorize.

✅ Código no GitHub!

---

## 🔰 PARTE 3: CONFIGURAR O SUPABASE (BANCO DE DADOS)

Agora vamos pegar as informações necessárias do banco.

### 3.1 Pegar a URL do banco

1. No Supabase, vá em **Project Settings** (engrenagem no menu lateral)
2. Clique em **Database** no menu esquerdo
3. Role até **Connection string**
4. Certifique-se que está selecionado **URI**
5. Copie a string que aparece (algo como):
   ```
   postgresql://postgres:senha@db.xxx.supabase.co:6543/postgres
   ```
6. **IMPORTANTE:** Na senha, se tiver `@`, troque por `%40`
   - Exemplo: senha `abc@123` → string fica `postgresql://postgres:abc%40123@db.xxx.supabase.co:6543/postgres`
7. Cole essa string no Bloco de Notas, vamos usar depois

### 3.2 Pegar as chaves de API

1. Ainda no Supabase, vá em **Project Settings → API**
2. Copie estes 3 valores para o Bloco de Notas:
   ```
   Project URL:        https://SEUPROJETO.supabase.co
   anon public key:    eyJhbGciOiJIUzI1NiIsInR5cCI6Ik5X... (grande)
   service_role key:   eyJhbGciOiJIUzI1NiIsInR5cCI6Ik5X... (grande)
   ```

✅ Supabase configurado! Mantenha o Bloco de Notas aberto com esses valores.

---

## 🔰 PARTE 4: FAZER DEPLOY DO BACKEND NO RENDER

### 4.1 Conectar o GitHub ao Render

1. No Render, clique em **"New +"** (canto superior direito)
2. Escolha **"Web Service"**
3. Clique em **"Connect account"** se não estiver conectado
4. Escolha **GitHub** e autorize
5. Selecione o repositório **vysera** que você criou

### 4.2 Configurar o Web Service

Preencha os campos:

```
Name: vysera-backend
Region: Oregon (USA)  [pode ser Frankfurt se tiver mais perto]
Branch: main
Runtime: Node
Build Command: cd backend && npm install && npm run build && npx prisma generate && npx prisma migrate deploy
Start Command: cd backend && node dist/server.js
Plan: Free
```

### 4.3 Adicionar as variáveis de ambiente

Clique em **"Advanced"** e depois **"Add Environment Variable"**. Adicione UMA A UMA:

| Variável | Valor | Como conseguir |
|----------|-------|---------------|
| `NODE_ENV` | `production` | Só digitar |
| `PORT` | `10000` | Só digitar |
| `DATABASE_URL` | `postgresql://...` | Copie do Bloco de Notas (passo 3.1) |
| `JWT_SECRET` | [clique aqui](https://10015.io/tools/random-string-generator) e gere 1 de 64 chars | Site externo |
| `JWT_REFRESH_SECRET` | [clique aqui](https://10015.io/tools/random-string-generator) e gere OUTRO de 64 chars | Site externo |
| `JWT_EXPIRES_IN` | `15m` | Só digitar |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Só digitar |
| `ENCRYPTION_KEY` | [clique aqui](https://10015.io/tools/random-string-generator) e gere 1 de 32 chars | Site externo |
| `CORS_ORIGIN` | `https://vysera-frontend.vercel.app` (VAMOS MUDAR DEPOIS) | Só digitar |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Copie do Bloco de Notas |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Copie do Bloco de Notas |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Copie do Bloco de Notas |
| `BCRYPT_SALT_ROUNDS` | `12` | Só digitar |
| `UPLOAD_DIR` | `/opt/render/project/src/backend/uploads` | Só digitar |

> 🔴 **MUITO IMPORTANTE:** O `JWT_SECRET` e `JWT_REFRESH_SECRET` precisam ser VALORES DIFERENTES. Gere um para cada.

### 4.4 Finalizar

1. Clique em **"Create Web Service"**
2. **Aguarde ~5 minutos** enquanto o Render faz o build
3. Você vai ver os logs subindo em tempo real
4. Quando aparecer `Listening on port 10000` → **deu certo!** 🎉

### 4.5 Pegar a URL do backend

1. No topo da página, vai ter algo como `https://vysera-backend.onrender.com`
2. Copie essa URL para o Bloco de Notas

✅ Backend no ar!

---

## 🔰 PARTE 5: FAZER DEPLOY DO FRONTEND NA VERCEL

### 5.1 Conectar e configurar

1. Na Vercel, clique em **"Add New..." → "Project"**
2. Clique em **"Continue with GitHub"** (se precisar autorizar)
3. Selecione o repositório **vysera**
4. Na tela de configuração:

```
Framework Preset: → Selecione "Next.js"
Root Directory:   → Clique e selecione "frontend"
Build Command:    → Deixe vazio (vai usar o padrão)
Output Directory: → Deixe vazio
```

### 5.2 Adicionar variáveis de ambiente

Clique em **"Environment Variables"** e adicione:

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` (copie do Bloco) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (copie do Bloco) |
| `NEXT_PUBLIC_API_URL` | `https://vysera-backend.onrender.com/api` (do passo 4.5) |

### 5.3 Fazer deploy

1. Clique em **"Deploy"**
2. **Aguarde ~2 minutos**
3. Quando aparecer "Congratulations, your project is deployed!" → **deu certo!** 🎉

### 5.4 Pegar a URL do frontend

1. A Vercel vai mostrar algo como `https://vysera-frontend.vercel.app`
2. Anote essa URL

✅ Frontend no ar!

---

## 🔰 PARTE 6: ATUALIZAR O CORS DO BACKEND

Lembra que colocamos `CORS_ORIGIN` como `https://vysera-frontend.vercel.app`? Agora precisamos colocar a URL correta.

### 6.1 Atualizar variável no Render

1. No Render, vá em **Dashboard → vysera-backend**
2. Clique em **"Environment"** no menu
3. Clique no **lápis** ao lado de `CORS_ORIGIN`
4. Mude para a URL exata do seu frontend (do passo 5.4)
   - Exemplo: `https://vysera-frontend.vercel.app`
5. Clique em **"Save Changes"**
6. O Render vai fazer um **novo deploy automaticamente**
7. Aguarde ~2 minutos

---

## 🔰 PARTE 7: POPULAR O BANCO (CRIAR USUÁRIOS E TEMPLATES)

### 7.1 Fazer o seed PELO NAVEGADOR (mais fácil)

Vamos usar o terminal do Render direto pelo navegador:

1. No Render, vá em **Dashboard → vysera-backend**
2. Clique na aba **"Shell"** (ou "Connect" → "Shell")
3. Uma tela preta vai abrir (é o terminal do servidor)
4. Digite: `cd backend`
5. Digite: `npx prisma db seed`
6. Deve aparecer:
   ```
   Seeding database...
     ✓ Admin user: admin@vysera.com
     ✓ Pro user: pro@vysera.com
     ✓ Free user: user@vysera.com
     ✓ 12 templates created
     ✓ Demo project: My First Video
   ```

### 7.2 Se o Shell não funcionar...

Alguns planos free do Render não têm Shell. Alternativa:

1. No computador, abra o PowerShell no diretório do projeto
2. Execute:
```bash
cd "C:\Users\rodri\OneDrive\Documentos\Vysera open code\vysera\backend"
$env:DATABASE_URL="SUA_STRING_DO_BANCO_AQUI"
npx prisma db seed
```
(Substitua `SUA_STRING_DO_BANCO_AQUI` pela string que você copiou no passo 3.1)

✅ Banco populado!

---

## 🔰 PARTE 8: TESTAR SE TUDO FUNCIONA

### 8.1 Testar o backend

1. Abra uma nova aba no navegador
2. Acesse: `https://vysera-backend.onrender.com/api/auth/login`
3. Deve aparecer uma tela em branco ou `{}` (é normal, é porque é POST)

Vamos testar de verdade usando o navegador mesmo:

1. Aperte **F12** no teclado (abre o console do desenvolvedor)
2. Vá na aba **Console**
3. Cole este código e aperte Enter:

```javascript
fetch('https://vysera-backend.onrender.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@vysera.com',
    password: 'Admin@123456'
  })
})
.then(r => r.json())
.then(d => console.log('✅ Login funcionou!', d))
.catch(e => console.error('❌ Erro:', e));
```

Se aparecer `✅ Login funcionou!` com um monte de dados → **backend OK!** 🎉

### 8.2 Testar o frontend

1. Acesse a URL do frontend: `https://vysera-frontend.vercel.app`
2. Você deve ver a página inicial do Vysera com:
   - Um navbar com "Vysera"
   - Seções: Features, How It Works, Pricing, etc.
3. Clique em **"Login"** ou **"Sign In"**
4. Faça login com:
   - **Email:** `admin@vysera.com`
   - **Senha:** `Admin@123456`
5. Se entrar na dashboard → **frontend OK!** 🎉

✅ Sistema funcionando!

---

## 🔰 PARTE 9: MANTER FUNCIONANDO (O PROBLEMA DO SONO)

### 9.1 O problema: Render free dorme

O Render free TEM UM PROBLEMA: depois de 15 minutos sem ninguém acessar, ele "dorme". Quando alguém acessa, demora ~30 segundos para "acordar".

Isso significa que:
- Se você ficar 15 minutos sem acessar, o backend desliga
- Quando você voltar, a primeira requisição vai demorar 30s
- Depois disso, funciona normal por mais 15 minutos

### 9.2 Solução grátis: Cron-job.org

Vamos usar um serviço grátis que pinga seu backend a cada 10 minutos (mantendo ele acordado):

1. Acesse **https://cron-job.org**
2. Clique em **"Sign Up Free"**
3. Crie uma conta (email + senha)
4. Verifique o email
5. Faça login
6. Clique em **"Create Cronjob"**
7. Preencha:
   - **Title:** `Vysera Keep Alive`
   - **URL:** `https://vysera-backend.onrender.com/api/health`
   - **Schedule:** `Every 10 minutes`
   - **Request Method:** `GET`
8. Clique em **"Create"**

Pronto! Agora seu backend vai ficar acordado 24/7! 🎉

---

## 🔰 PARTE 10: CONFIGURAR STRIPE (OPCIONAL - PARA COBRAR)

Se você quiser cobrar clientes pelos planos:

### 10.1 Criar conta Stripe

1. Acesse **https://stripe.com**
2. Clique em **"Start now"**
3. Preencha seu email, nome e senha
4. Confirme o email
5. Responda: "Como você descreveria seu negócio?" → **"Plataforma ou marketplace"**
6. Responda o resto rápido (pode pular)

### 10.2 Pegar as chaves de teste

1. No dashboard do Stripe, clique em **"Developers"** (canto superior direito)
2. Clique em **"API keys"**
3. Copie:
   - **Standard keys → Publishable key** (começa com `pk_test_...`)
   - **Standard keys → Secret key** (começa com `sk_test_...`)

### 10.3 Configurar webhook

1. No Stripe, vá em **Developers → Webhooks**
2. Clique em **"Add endpoint"**
3. Preencha:
   - **Endpoint URL:** `https://vysera-backend.onrender.com/api/payments/webhook`
   - **Listen to:** Selecione "Events in your account"
   - Clique em **"Select events"** e marque:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
4. Clique em **"Add endpoint"**
5. Na página do webhook, copie o **"Signing secret"** (começa com `whsec_...`)

### 10.4 Criar preço no Stripe

1. No Stripe, vá em **Products → Add product**
2. Crie 2 produtos:

**Produto 1 - Pro Mensal:**
- **Name:** `Pro Monthly`
- **Description:** `Vysera Pro - Monthly`
- **Pricing model:** `Standard pricing`
- **Price:** `$19.00 USD` (ou o valor em Reais)
- **Recurring:** `Monthly`
- Clique em **"Save"**
- Copie o **Price ID** (começa com `price_...`)

**Produto 2 - Pro Anual:**
- **Name:** `Pro Yearly`
- **Description:** `Vysera Pro - Yearly`  
- **Price:** `$159.00 USD`
- **Recurring:** `Yearly`
- Clique em **"Save"**
- Copie o **Price ID**

### 10.5 Adicionar no Render

No Render, vá em **Environment** e adicione:

| Variável | Valor |
|----------|-------|
| `STRIPE_SECRET_KEY` | `sk_test_...` (do passo 10.2) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (do passo 10.3) |
| `STRIPE_PRO_PRICE_ID` | `price_...` (do passo 10.4) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (do passo 10.2) |

Adicione `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` também na Vercel.

---

## 📋 RESUMO: TUDO QUE VOCÊ CRIOU

| Recurso | URL | Login |
|---------|-----|-------|
| Frontend (Vysera) | `https://vysera-frontend.vercel.app` | admin@vysera.com / Admin@123456 |
| Backend (API) | `https://vysera-backend.onrender.com` | (via API) |
| GitHub (código) | `https://github.com/SEU_USUARIO/vysera` | (seu login) |
| Supabase (banco) | `https://supabase.com` | (seu login) |
| Render (servidor) | `https://dashboard.render.com` | (seu login) |
| Vercel (site) | `https://vercel.com` | (seu login) |
| Cron-job (anti-sono) | `https://cron-job.org` | (seu email) |

---

## ⚡ DICA EXTRA: COMO ATUALIZAR O CÓDIGO

Quando você fizer alguma alteração no código e quiser subir:

### Pelo computador:

```bash
# Entre na pasta
cd "C:\Users\rodri\OneDrive\Documentos\Vysera open code\vysera"

# Adicione as alterações
git add .

# Crie um "commit"
git commit -m "descrição do que mudou"

# Envie para o GitHub
git push
```

Assim que der `git push`:
- O Render detecta a mudança e faz deploy automático (~3 min)
- A Vercel detecta a mudança e faz deploy automático (~2 min)

**Pronto!** Seu código novo está no ar automaticamente.

---

## 🆘 PROBLEMAS COMUNS E SOLUÇÕES

### "Não aparece nada no site"
- **Causa:** O Render pode estar "dormindo"
- **Solução:** Espere 30 segundos e recarregue a página

### "Erro 502 Bad Gateway"
- **Causa:** O backend caiu
- **Solução:** Vá no Render, clique em **"Manual Deploy" → "Clear build cache & deploy"**

### "CORS error" no navegador
- **Causa:** A URL do CORS está errada
- **Solução:** Verifique se `CORS_ORIGIN` no Render é EXATAMENTE igual à URL do frontend (com `https://` e sem `/` no final)

### "Login não funciona"
- **Causa:** Seed não foi executado
- **Solução:** Volte ao passo 7 e execute `npx prisma db seed`

### "PrismaClientInitializationError"
- **Causa:** O banco não foi migrado
- **Solução:** No Render, vá em **Shell** e execute:
  ```bash
  cd backend && npx prisma migrate deploy
  ```

### "O site está lento"
- **Causa:** Free tier do Render é limitado
- **Solução:** Por enquanto é normal. No futuro, upgrade para o Render **$7/mês** (não dorme + mais rápido)

---

## 🎉 PARABÉNS!

Se você seguiu todos os passos, o Vysera está:

✅ Rodando na internet
✅ Com banco de dados
✅ Com login funcionando
✅ Disponível para qualquer pessoa acessar
✅ 100% de graça

**Agora você pode:**
- Compartilhar o link com amigos
- Criar vídeos
- Fazer alterações no código e subir com `git push`
- Configurar o Stripe para cobrar clientes

Bem-vindo ao mundo da programação! 🚀
