# Site — Dra. Beatriz Rosa (Reumatologia Pediátrica)

Site profissional para uma médica reumatologista pediátrica, com foco em
autoridade/credibilidade e agendamento de consultas funcional de verdade
(não é só um formulário que manda e-mail — o horário fica reservado no
banco de dados de forma segura, sem risco de dois pacientes marcarem o
mesmo horário).

**No ar em:** `https://beatriz-rosa-site.vercel.app`

## Stack

| Camada | Tecnologia | Por quê |
|---|---|---|
| Frontend | HTML, CSS e JavaScript puros (sem framework) | O conteúdo é majoritariamente estático; um framework como React não traria benefício real aqui, só complexidade |
| Backend | [Vercel Functions](https://vercel.com/docs/functions) (Node.js) | Funções sob demanda, sem servidor para manter no ar, deploy automático a cada `git push` |
| Banco de dados | [Neon](https://neon.tech) (Postgres serverless) | Postgres "de verdade", com driver HTTP otimizado para funções serverless |
| Autenticação | JWT ([jose](https://github.com/panva/jose)) + cookie `HttpOnly` | Sessão da médica sem depender de serviço de terceiros |
| Hospedagem | [Vercel](https://vercel.com) | Deploy automático a partir do GitHub, HTTPS grátis, domínio próprio fácil de configurar |

Nenhuma credencial de banco de dados chega ao navegador em nenhum momento —
toda a lógica de acesso a dados roda no servidor (pasta `/api`). Veja o
detalhamento completo da arquitetura e das decisões de segurança em
**[`BACKEND.md`](./BACKEND.md)**.

## Funcionalidades

- Apresentação institucional (formação, áreas de atuação, sinais de alerta, FAQ)
- Agendamento por calendário interativo — apenas sábados, 08h–18h
- Verificação de disponibilidade em tempo real (o horário só aparece livre
  se realmente estiver livre no banco de dados)
- Confirmação automática via WhatsApp com a mensagem já preenchida
- Painel administrativo (`/admin.html`) com login, listagem de agendamentos
  e alteração de status (pendente / confirmado / cancelado)
- Proteção contra agendamento duplicado garantida no próprio banco de dados
  (não só na interface — resistente a condições de corrida)
- Limite de tentativas por IP na criação de agendamentos (proteção básica
  contra abuso/spam)

## Estrutura do projeto

```
beatriz-rosa-site/
├── index.html              → site público
├── admin.html               → painel da médica
├── package.json             → dependências (Node.js)
├── .env.example              → modelo de variáveis de ambiente
├── database/
│   └── schema.sql             → schema do banco (Postgres)
├── lib/                      → código compartilhado pela API
│   ├── db.js
│   ├── auth.js
│   └── rateLimit.js
├── scripts/
│   └── create-admin.js        → cria o login da médica (rodar uma vez, local)
└── api/                       → rotas HTTP (Vercel Functions)
    ├── availability.js
    ├── auth/
    │   ├── login.js
    │   ├── logout.js
    │   └── session.js
    └── appointments/
        ├── index.js
        └── [id].js
```

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # depois preencha DATABASE_URL e JWT_SECRET
node scripts/create-admin.js # cria o login de acesso ao /admin.html
```

Para testar as rotas de API localmente, use a [Vercel CLI](https://vercel.com/docs/cli):

```bash
npm install -g vercel
vercel dev
```

Guia completo (criar o banco no Neon, configurar tudo do zero) em
**[`BACKEND.md`](./BACKEND.md)**.

## Deploy

O deploy é automático: qualquer `git push` na branch `main` publica uma nova
versão no Vercel. Variáveis de ambiente (`DATABASE_URL`, `JWT_SECRET`) ficam
configuradas em **Vercel → Settings → Environment Variables**, nunca no código.

```bash
git add .
git commit -m "Descrição da alteração"
git push
```

### Domínio próprio

Comprar um domínio não exige trocar de hospedagem: em **Vercel → Settings →
Domains**, adicione o domínio e configure os registros DNS indicados pelo
próprio Vercel. HTTPS é ativado automaticamente.

## Decisões de design

- **Sem framework de frontend**: o conteúdo é majoritariamente institucional
  e estático; a única parte dinâmica (calendário/agendamento) não justifica
  o custo de build/complexidade de um framework como React ou Next.js.
- **Vercel Functions em vez de um servidor Express dedicado**: elimina custo
  de manter um servidor ligado 24h para um site de baixo tráfego, e o deploy
  fica unificado com o resto do projeto.
- **Neon em vez de um Postgres autogerenciado**: Postgres padrão (sem
  vendor lock-in — os dados podem ser exportados/migrados a qualquer momento),
  com um driver HTTP feito sob medida para ambientes serverless.
- **JWT em cookie `HttpOnly` em vez de `localStorage`**: elimina a
  possibilidade de um script malicioso (XSS) roubar a sessão da médica.

## Pendências de conteúdo (a confirmar com a Dra. Beatriz)
- [ ] Foto profissional
- [ ] Endereço completo do consultório em Vila Clementino
- [ ] Manter ou remover "Mestrado em andamento"
- [ ] Convênios aceitos, ou só atendimento particular
- [ ] E-mail profissional de contato

## Número de WhatsApp usado no agendamento
`5511933412191` — está na variável `WHATSAPP_NUMBER` dentro do `<script>` do
`index.html`, e também no rodapé.
