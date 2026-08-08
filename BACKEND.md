# Backend — arquitetura própria (sem Supabase)

Este documento explica a arquitetura de backend do site e o passo a passo
completo para colocá-la no ar. É pensado para você entender **o que** cada
peça faz e **por que** ela existe — não só copiar comandos.

## Visão geral da arquitetura

```
Navegador (index.html / admin.html)
        │
        │  fetch('/api/...')   ← nunca fala direto com o banco
        ▼
Vercel Functions (pasta /api)   ← "o servidor", roda sob demanda, sem custo parado
        │
        │  usa DATABASE_URL (segredo, só existe no servidor)
        ▼
Neon Postgres (o banco de dados)
```

Diferença chave em relação ao modelo anterior (Supabase): o navegador da
pessoa que visita o site **nunca** tem acesso a nenhuma credencial de banco
de dados. Toda regra de "quem pode fazer o quê" está escrita em código,
dentro da pasta `/api`, rodando exclusivamente no servidor.

## Estrutura de arquivos

```
beatriz-rosa-site/
├── index.html                    → site público
├── admin.html                    → painel da médica
├── package.json                  → dependências do projeto (Node.js)
├── .env.example                  → modelo das variáveis de ambiente (sem segredos reais)
├── .gitignore                    → impede que segredos/node_modules subam pro GitHub
│
├── database/
│   └── schema.sql                → cria as tabelas no Neon (rodar uma vez)
│
├── lib/                          → código compartilhado entre as rotas da API
│   ├── db.js                     → conexão com o banco
│   ├── auth.js                   → login, token (JWT), cookie de sessão
│   └── rateLimit.js              → limite de tentativas por IP
│
├── scripts/
│   └── create-admin.js           → cria o login da médica (rodar localmente, uma vez)
│
└── api/                          → cada arquivo aqui vira uma rota HTTP automaticamente
    ├── availability.js           → GET  /api/availability?date=...
    ├── auth/
    │   ├── login.js              → POST /api/auth/login
    │   ├── logout.js             → POST /api/auth/logout
    │   └── session.js            → GET  /api/auth/session
    └── appointments/
        ├── index.js              → GET (listar) e POST (criar) /api/appointments
        └── [id].js               → PATCH /api/appointments/:id
```

> O Vercel transforma automaticamente qualquer arquivo dentro de `/api` numa
> rota HTTP — não é preciso configurar um servidor Express nem nada parecido.
> É esse recurso que se chama "Vercel Functions".

## Passo 1 — Criar o banco de dados no Neon

1. Acesse [neon.tech](https://neon.tech) e crie uma conta gratuita.
2. Clique em **Create a project**. Dê um nome (ex: `beatriz-rosa-site`) e escolha
   a região mais próxima (ex: AWS South America - São Paulo, se disponível, ou US East).
3. Assim que o projeto for criado, vá em **SQL Editor** no menu lateral.
4. Abra o arquivo `database/schema.sql` deste projeto, copie todo o conteúdo,
   cole no editor e clique em **Run**.
5. Vá em **Connection Details** (ou "Dashboard" → "Connection string") e copie
   a **"Pooled connection"** — é uma URL parecida com:
   ```
   postgres://usuario:senha@ep-xxxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
   ```
   Guarde essa URL — é a sua `DATABASE_URL`.

## Passo 2 — Instalar o Node.js (se ainda não tiver)

No terminal, rode `node --version`. Se aparecer um número (ex: `v20.x.x`),
já está instalado. Se der erro, baixe em [nodejs.org](https://nodejs.org)
(escolha a versão **LTS**) e instale normalmente.

## Passo 3 — Configurar o projeto localmente

Dentro da pasta do projeto:

```
npm install
```

Isso lê o `package.json` e baixa as três bibliotecas que usamos
(`@neondatabase/serverless`, `bcryptjs`, `jose`) para a pasta `node_modules`
— que nunca vai para o GitHub (veja o `.gitignore`).

Depois, copie o arquivo de exemplo:

```
copy .env.example .env.local
```
*(no Mac/Linux seria `cp .env.example .env.local`)*

Abra o `.env.local` e preencha:
- `DATABASE_URL` → a URL que você copiou do Neon no Passo 1
- `JWT_SECRET` → uma string aleatória longa. Gere uma rodando:
  ```
  node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
  ```
  e cole o resultado.

## Passo 4 — Criar o login da Dra. Beatriz

Com o `.env.local` preenchido, rode:

```
node scripts/create-admin.js
```

Digite o e-mail e a senha que a Dra. Beatriz vai usar para entrar no painel.
O script guarda a senha **criptografada** (hash bcrypt) no banco — não em
texto puro.

## Passo 5 — Configurar as variáveis de ambiente no Vercel

O `.env.local` só funciona no seu computador. Para o site publicado
funcionar, o Vercel precisa das mesmas variáveis:

1. No painel do Vercel, abra o projeto `beatriz-rosa-site`.
2. Vá em **Settings → Environment Variables**.
3. Adicione:
   - `DATABASE_URL` → mesmo valor do `.env.local`
   - `JWT_SECRET` → mesmo valor do `.env.local`
4. Marque para os três ambientes (**Production**, **Preview**, **Development**).
5. Salve.

## Passo 6 — Subir para o GitHub e publicar

```
git add .
git commit -m "Adiciona backend proprio: Vercel Functions + Neon Postgres"
git push
```

O Vercel detecta o `package.json`, instala as dependências sozinho durante o
deploy, e publica tanto o site quanto as funções da API. Não é preciso
nenhuma configuração extra de "build command" — o Vercel já sabe como lidar
com uma pasta `/api`.

> Se você já tinha as variáveis de ambiente do Supabase configuradas no
> Vercel, pode remover `SUPABASE_URL`/`SUPABASE_ANON_KEY` de lá — não são
> mais usadas.

## Passo 7 — Testar em produção

1. Acesse o site publicado, escolha um sábado, um horário, preencha o nome
   e envie. Deve funcionar normalmente e abrir o WhatsApp.
2. Tente marcar o **mesmo horário de novo** — deve aparecer bloqueado
   ("ocupado"), confirmando que a trava do banco está funcionando.
3. Acesse `/admin.html`, faça login com o e-mail/senha criados no Passo 4.
4. O agendamento de teste deve aparecer. Teste os botões **Confirmar** e
   **Cancelar**.
5. Clique em **Sair** e confirme que a tela de login volta a aparecer.

## Decisões de segurança explicadas

| Decisão | Por quê |
|---|---|
| Senha nunca fica em texto puro, só o hash (bcrypt) | Mesmo que alguém consiga acesso ao banco, não consegue recuperar a senha original |
| Login usa cookie `HttpOnly` (não `localStorage`) | JavaScript malicioso injetado na página não consegue ler o cookie e "roubar" a sessão |
| Cookie com `Secure` em produção | O cookie só trafega por conexões HTTPS, nunca em texto puro pela rede |
| Todo dado recebido do navegador é validado de novo no servidor | O navegador pode ser manipulado por quem o está usando; nunca confiar só na validação da tela |
| Erro de login não diz "e-mail não existe" vs "senha errada" | Evita que alguém descubra, por tentativa e erro, quais e-mails têm conta |
| Limite de tentativas por IP na criação de agendamentos | Impede um script automatizado de lotar o banco com agendamentos falsos |
| Trava de horário duplicado no próprio banco (`unique index`), não só no código | Garante que a regra vale mesmo se dois pedidos chegarem no mesmíssimo instante — uma validação só em JavaScript não conseguiria pegar essa corrida |
| `DATABASE_URL` e `JWT_SECRET` só existem como variável de ambiente, nunca no código | Se o repositório do GitHub for público (como é o caso), ninguém consegue ver essas informações |

## Sobre dados pessoais (LGPD)

O formulário coleta nome do responsável, nome da criança e (opcionalmente)
telefone — não coleta nenhum dado de saúde. Ainda assim, são dados pessoais.
Recomendações:
- Adicionar uma linha curta no formulário avisando que os dados são usados
  só para confirmar a consulta.
- De tempos em tempos, revisar e apagar do banco agendamentos antigos que
  não são mais necessários (pelo painel, ou direto no Neon em **Tables**).

## Se algo der errado

- **"Internal Server Error" ao carregar o site**: normalmente é uma variável
  de ambiente faltando no Vercel. Confira em Settings → Environment Variables.
- **Login não funciona em produção mas funciona local**: confira se marcou
  "Production" ao adicionar as variáveis de ambiente no Vercel, e se fez um
  novo deploy depois de adicioná-las (variáveis de ambiente só entram em
  vigor em deploys feitos depois de serem configuradas).
- **Quer ver os logs de erro em produção**: no painel do Vercel, aba
  **Deployments** → clique no deploy mais recente → **Functions** → escolha
  a função → veja os logs em tempo real.

## Pendências para revisar com a Dra. Beatriz
- [ ] Foto profissional
- [ ] Endereço completo do consultório em Vila Clementino
- [ ] Manter ou remover "Mestrado em andamento"
- [ ] Convênios aceitos, ou só atendimento particular
- [ ] E-mail profissional de contato
- [ ] E-mail e senha de acesso da Dra. Beatriz ao painel (Passo 4)
