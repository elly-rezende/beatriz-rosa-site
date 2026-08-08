/**
 * GET /api/auth/session
 *
 * Usada pelo admin.html assim que a página carrega, para saber se o
 * navegador já tem um cookie de sessão válido (e assim decidir se mostra
 * a tela de login ou já vai direto para o painel).
 */

const { readCookie, verifySessionToken, COOKIE_NAME } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const token = readCookie(req, COOKIE_NAME);
  const session = await verifySessionToken(token);

  if (!session) {
    return res.status(200).json({ authenticated: false });
  }

  return res.status(200).json({ authenticated: true, email: session.email });
};
