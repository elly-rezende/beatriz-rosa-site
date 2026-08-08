/**
 * scripts/create-admin.js
 *
 * Roda UMA VEZ, no seu computador, para criar (ou atualizar) o login
 * da Dra. Beatriz no banco de dados — com a senha já criptografada
 * (hash bcrypt), nunca em texto puro.
 *
 * Como rodar:
 *   1) Instale as dependências:      npm install
 *   2) Crie o arquivo .env.local (copie de .env.example) com a
 *      DATABASE_URL real do seu projeto Neon.
 *   3) Rode:                         node scripts/create-admin.js
 *   4) Responda o e-mail e a senha quando for perguntado.
 */

require('dotenv').config({ path: '.env.local' });
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { neon } = require('@neondatabase/serverless');

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    if (!hidden) {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
      return;
    }

    // Esconde a senha digitada no terminal (não mostra os caracteres).
    const output = process.stdout;
    rl._writeToOutput = function (stringToWrite) {
      if (stringToWrite.trim() === question.trim()) output.write(stringToWrite);
      // caso contrário, não escreve nada (esconde o que foi digitado)
    };
    rl.question(question, (answer) => {
      rl.close();
      output.write('\n');
      resolve(answer);
    });
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não encontrada. Confira se o arquivo .env.local existe e está preenchido.');
    process.exit(1);
  }

  console.log('== Criar acesso da Dra. Beatriz ao painel ==\n');

  const email = (await ask('E-mail: ')).trim().toLowerCase();
  const password = await ask('Senha (mínimo 8 caracteres): ', { hidden: true });

  if (!email || !password || password.length < 8) {
    console.error('\n❌ E-mail inválido ou senha muito curta (mínimo 8 caracteres).');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const passwordHash = await bcrypt.hash(password, 12);

  await sql`
    insert into admins (email, password_hash)
    values (${email}, ${passwordHash})
    on conflict (email) do update set password_hash = excluded.password_hash
  `;

  console.log(`\n✅ Pronto! Login criado/atualizado para: ${email}`);
  console.log('Você já pode usar esse e-mail e senha em /admin.html no site.');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Erro ao criar o admin:', err.message);
  process.exit(1);
});
