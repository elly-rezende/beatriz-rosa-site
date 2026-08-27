# Atualização — textos das doenças, novo campo e limpeza de FAQ

## O que fazer

**1) Copie e substitua estes arquivos na sua pasta `vercel-repo`:**
- `index.html`
- `sobre.html`
- pasta `doencas/` inteira (as 12 páginas)
- `css/style.css`

**2) Rode a migração no banco (Neon → SQL Editor):**
Cole e execute o conteúdo de `migration_002_add_reason.sql` (adiciona a coluna `reason` na tabela de agendamentos).

**3) Edite manualmente dois arquivos que só existem na sua pasta local** (instruções
detalhadas na mensagem do chat):
- `api/appointments/index.js` — para salvar o novo campo "motivo da consulta"
- `admin.html` — para exibir esse campo no painel (opcional)

**4) Publique:**
```
git add .
git commit -m "Atualiza textos medicos, adiciona campo motivo da consulta, remove pergunta duplicada do FAQ"
git push
```

## O que mudou

1. **Textos médicos revisados** em 9 das 12 páginas de doenças (AIJ, Lúpus,
   Dermatomiosite, Febre Reumática, Vasculite por IgA, Kawasaki, SIM-P,
   Hipermobilidade/Fibromialgia, Osteoporose) — exatamente conforme as
   correções que você passou.
2. **Novo campo no formulário**: "Descrição breve do motivo da consulta"
   (opcional, até 300 caracteres) — aparece na mensagem do WhatsApp e é salvo
   no banco de dados junto com o resto do agendamento.
3. **Pergunta removida do FAQ**: "Quando devo procurar um reumatologista
   pediátrico?" — já que a informação já aparece na tabela de sinais de
   atenção, mais acima na página.

## Sobre a Doença de Kawasaki
Você pediu para tirar "vasos sanguíneos em todo o corpo." — mantive "vasos
sanguíneos" (removendo só "em todo o corpo"), porque removendo a frase inteira
a oração ficaria incompleta ("...causando inflamação."). Se a intenção era
outra, me diga e ajusto.

## Aguardando de você
- Os depoimentos de pacientes (para a seção "Avaliações")
