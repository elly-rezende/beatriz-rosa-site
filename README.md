# Site — Dra. Beatriz Rosa (Reumatologia Pediátrica)

Site estático (um único `index.html`, com CSS e JavaScript embutidos — sem
WordPress, sem backend, sem banco de dados). Pronto para GitHub + Vercel.

## Arquivos

```
beatriz-rosa-site/
├── README.md
└── index.html   → o site inteiro
```

## Passo 1 — Terminar de criar o repositório no GitHub

Você já estava na tela certa (`github.com/new`, dono `elly-rezende`, nome
`beatriz-rosa-site`, visibilidade **Public**, README **desligado**, sem
.gitignore, sem licença). Está tudo certo assim — **não ligue o README nem
adicione .gitignore**, porque o projeto já vem pronto com esses arquivos.

1. Clique em **Create repository**.
2. O GitHub vai te mostrar uma tela com comandos — **ignore-os**, vamos usar os
   comandos abaixo, porque este projeto já vem com o Git inicializado.

## Passo 2 — Subir este projeto para o repositório

1. Baixe e descompacte o arquivo `beatriz-rosa-site.zip` que te enviei.
2. Abra o terminal dentro da pasta `beatriz-rosa-site` (a que tem o `index.html`).
3. Rode:
   ```
   git remote add origin https://github.com/elly-rezende/beatriz-rosa-site.git
   git push -u origin main
   ```
4. Atualize a página do repositório no GitHub — os arquivos devem aparecer lá.

> Se pedir usuário e senha, o GitHub não aceita mais senha normal — use um
> **Personal Access Token** (Settings → Developer settings → Personal access
> tokens) no lugar da senha, ou instale o GitHub Desktop e conecte sua conta
> por lá, que é mais simples.

## Passo 3 — Publicar no Vercel

1. Acesse [vercel.com](https://vercel.com) e entre com sua conta do GitHub.
2. Clique em **Add New → Project**.
3. Selecione o repositório `beatriz-rosa-site`.
4. Em "Framework Preset", deixe como **Other** (é HTML puro, não precisa de build).
5. Não precisa mudar mais nada — clique em **Deploy**.
6. Em 1 minuto o Vercel te dá um link tipo `beatriz-rosa-site.vercel.app` já no ar.

## Passo 4 — Domínio próprio (quando comprar)

1. Compre o domínio onde preferir (Registro.br, se quiser `.com.br`, ou GoDaddy/Namecheap para `.com`).
2. No painel do Vercel, abra o projeto → **Settings → Domains** → adicione o domínio comprado.
3. O Vercel mostra os registros DNS exatos para configurar no painel do domínio (geralmente um registro tipo `A` ou `CNAME`). Depois de configurar, o Vercel confirma automaticamente e ativa o HTTPS.

## Atualizando o site depois

Sempre que editar o `index.html`, rode:
```
git add .
git commit -m "Descrição da alteração"
git push
```
O Vercel publica a nova versão automaticamente a cada `push`, sem nenhum passo extra.

## Pendências para revisar com a Dra. Beatriz
- [ ] Foto profissional (hoje há um espaço reservado ilustrado no lugar)
- [ ] Endereço completo do consultório em Vila Clementino
- [ ] Manter ou remover "Mestrado em andamento"
- [ ] Convênios aceitos, ou só atendimento particular
- [ ] E-mail profissional de contato

## Número de WhatsApp usado no agendamento
`5511933412191` — está na variável `WHATSAPP_NUMBER` dentro do `<script>` do `index.html`, e também no rodapé.

## Sobre "migrar para WordPress no futuro"
Quando quiser, dá pra reaproveitar todo o texto e a estrutura deste site num
tema WordPress (inclusive no Mediora, se ainda fizer sentido). Como o conteúdo
já está pronto e organizado aqui, essa migração fica bem mais rápida quando
chegar a hora — é só me avisar.
