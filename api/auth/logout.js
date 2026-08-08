/**
 * POST /api/auth/logout
 * Apaga o cookie de sessão. Simples assim.
 */

const { buildLogoutCookie } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  res.setHeader('Set-Cookie', buildLogoutCookie());
  return res.status(200).json({ ok: true });
};
