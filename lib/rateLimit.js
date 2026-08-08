/**
 * lib/rateLimit.js
 *
 * Limite simples de tentativas por IP, guardado no próprio banco.
 * Não usamos memória do processo (uma variável comum em JavaScript) porque
 * em ambiente serverless cada requisição pode rodar numa instância
 * diferente do servidor — a "memória" não é compartilhada entre elas.
 * O banco de dados é o único lugar confiável para guardar esse controle.
 */

const { sql } = require('./db');

const WINDOW_MINUTES = 10;
const MAX_ATTEMPTS_IN_WINDOW = 5;

/** Descobre o IP de quem fez a requisição (o Vercel preenche este cabeçalho). */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'desconhecido';
}

/**
 * Verifica se este IP já tentou agendar demais nos últimos WINDOW_MINUTES.
 * Se estiver dentro do limite, registra mais uma tentativa e retorna true.
 * Se já passou do limite, retorna false (a rota deve recusar o pedido).
 */
async function checkAndRecordAttempt(req) {
  const ip = getClientIp(req);
  const cutoff = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const recent = await sql`
    select count(*)::int as total
    from booking_attempts
    where ip = ${ip}
      and created_at > ${cutoff}
  `;

  if (recent[0].total >= MAX_ATTEMPTS_IN_WINDOW) {
    return false;
  }

  await sql`insert into booking_attempts (ip) values (${ip})`;
  return true;
}

module.exports = { checkAndRecordAttempt };
