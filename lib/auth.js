/**
 * lib/auth.js
 *
 * Tudo relacionado a "provar quem é quem" mora aqui:
 * - criar um token assinado (JWT) quando o login der certo
 * - ler e validar esse token nas rotas protegidas
 * - montar/ler o cookie que carrega o token entre o navegador e o servidor
 *
 * Por que JWT + cookie httpOnly, e não localStorage?
 * Um token guardado em localStorage pode ser lido por qualquer script que
 * rodar na página (inclusive um script malicioso injetado por uma falha de
 * XSS). Um cookie "httpOnly" simplesmente não pode ser lido pelo JavaScript
 * do navegador — só o próprio navegador o envia automaticamente nas
 * requisições, e só o servidor consegue lê-lo. É a prática recomendada para
 * sessões de login.
 */

const { SignJWT, jwtVerify } = require('jose');

const COOKIE_NAME = 'beatriz_admin_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 dias

if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET não está definida. Configure-a no .env.local (local) ' +
    'ou em Vercel → Project Settings → Environment Variables (produção).'
  );
}

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * Cria um token assinado contendo o id e o e-mail do admin logado.
 * O token expira sozinho depois de SESSION_DURATION_SECONDS — mesmo que o
 * cookie fosse roubado, ele para de funcionar depois desse prazo.
 */
async function createSessionToken({ adminId, email }) {
  return await new SignJWT({ adminId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey);
}

/**
 * Verifica se um token é válido e não expirou.
 * Retorna os dados do admin se for válido, ou null se não for
 * (token ausente, adulterado ou expirado).
 */
async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload; // { adminId, email, iat, exp }
  } catch (err) {
    return null; // assinatura inválida, expirado, ou corrompido
  }
}

/**
 * Monta o cabeçalho "Set-Cookie" para enviar o token de sessão ao navegador.
 * Flags importantes:
 *  - HttpOnly   → JavaScript do navegador não consegue ler este cookie
 *  - Secure     → só é enviado em conexões HTTPS (produção no Vercel é sempre HTTPS)
 *  - SameSite=Lax → protege contra ataques CSRF básicos, sem quebrar navegação normal
 *  - Path=/     → o cookie vale para o site inteiro
 */
function buildSessionCookie(token) {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_DURATION_SECONDS}`,
  ];
  if (process.env.VERCEL_ENV) {
    // Em produção/preview no Vercel a conexão é sempre HTTPS.
    // Em desenvolvimento local (http://localhost) o navegador rejeitaria
    // um cookie "Secure" numa conexão não-HTTPS, por isso só adicionamos
    // essa flag quando sabemos que estamos rodando no Vercel.
    parts.push('Secure');
  }
  return parts.join('; ');
}

/** Cabeçalho para apagar o cookie no logout (mesmo nome, expiração no passado). */
function buildLogoutCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/** Lê o valor de um cookie específico a partir do cabeçalho "Cookie" da requisição. */
function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  const match = header
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? match.substring(name.length + 1) : null;
}

/**
 * Middleware simples para proteger uma rota.
 * Uso dentro de uma rota da API:
 *
 *   const admin = await requireAuth(req, res);
 *   if (!admin) return; // requireAuth já enviou a resposta 401
 *
 */
async function requireAuth(req, res) {
  const token = readCookie(req, COOKIE_NAME);
  const admin = await verifySessionToken(token);
  if (!admin) {
    res.status(401).json({ error: 'Não autenticado. Faça login novamente.' });
    return null;
  }
  return admin;
}

module.exports = {
  COOKIE_NAME,
  createSessionToken,
  verifySessionToken,
  buildSessionCookie,
  buildLogoutCookie,
  readCookie,
  requireAuth,
};
