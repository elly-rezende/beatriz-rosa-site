/**
 * POST /api/auth/login
 *
 * Recebe e-mail + senha, confere contra o hash guardado no banco,
 * e se bater, devolve um cookie de sessão (a médica fica "logada").
 */

const bcrypt = require('bcryptjs');
const { sql } = require('../../lib/db');
const { createSessionToken, buildSessionCookie } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const rows = await sql`
      select id, email, password_hash from admins where email = ${email.trim().toLowerCase()}
    `;

    // Mensagem de erro propositalmente genérica nos dois casos (usuário não
    // existe / senha errada) — não damos pista de qual dos dois está errado,
    // porque isso ajudaria alguém tentando adivinhar credenciais.
    const invalidCredentials = () =>
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });

    if (rows.length === 0) return invalidCredentials();

    const admin = rows[0];
    const passwordMatches = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatches) return invalidCredentials();

    const token = await createSessionToken({ adminId: admin.id, email: admin.email });
    res.setHeader('Set-Cookie', buildSessionCookie(token));

    return res.status(200).json({ email: admin.email });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro interno ao processar o login.' });
  }
};
