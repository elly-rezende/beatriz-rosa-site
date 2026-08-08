/**
 * lib/db.js
 *
 * Ponto único de conexão com o banco de dados.
 * Toda rota da API importa o "sql" daqui em vez de criar sua própria conexão —
 * assim, se um dia trocarmos de banco ou de driver, mudamos em um lugar só.
 *
 * Usamos o driver @neondatabase/serverless (em vez do driver "pg" tradicional)
 * porque ele fala com o Neon por HTTP, o que funciona muito melhor em funções
 * serverless: cada chamada é curta e isolada, sem precisar manter uma conexão
 * TCP aberta o tempo todo (o que causaria erros de "too many connections"
 * conforme o site recebesse mais acessos).
 */

const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  // Falha alto e claro em vez de deixar cada rota descobrir isso sozinha
  // com um erro confuso lá na frente.
  throw new Error(
    'DATABASE_URL não está definida. Configure-a no arquivo .env.local (local) ' +
    'ou em Vercel → Project Settings → Environment Variables (produção).'
  );
}

const sql = neon(process.env.DATABASE_URL);

module.exports = { sql };
