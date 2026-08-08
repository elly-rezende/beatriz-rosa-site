/**
 * /api/appointments
 *
 *  GET  → lista todos os agendamentos. PROTEGIDA: só a médica logada acessa.
 *  POST → cria um novo pedido de agendamento. PÚBLICA, mas com validação
 *         rigorosa e limite de tentativas por IP (evita spam/abuso).
 */

const { sql } = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');
const { checkAndRecordAttempt } = require('../../lib/rateLimit');

const MAX_NAME_LENGTH = 120;

module.exports = async (req, res) => {
  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Método não permitido.' });
};

async function handleList(req, res) {
  const admin = await requireAuth(req, res);
  if (!admin) return; // requireAuth já respondeu com 401

  try {
    const rows = await sql`
      select id, responsible_name, child_name, child_age, status, created_at
      from appointments
      order by created_at desc
    `;
    return res.status(200).json({ appointments: rows });
  } catch (err) {
    console.error('Erro ao listar agendamentos:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar agendamentos.' });
  }
}

async function handleCreate(req, res) {
  // 1) Limite de tentativas por IP, para evitar abuso/spam automatizado.
  const allowed = await checkAndRecordAttempt(req);
  if (!allowed) {
    return res.status(429).json({
      error: 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.',
    });
  }

  // 2) Validação dos dados recebidos — nunca confiar no que vem do navegador.
  const { responsible_name, child_name, child_age, phone } = req.body || {};

  const cleanName = (responsible_name || '').trim();
  if (!cleanName || cleanName.length > MAX_NAME_LENGTH) {
    return res.status(400).json({ error: 'Nome do responsável é obrigatório.' });
  }

  const cleanChildName = (child_name || '').trim();
  if (!cleanChildName || cleanChildName.length > MAX_NAME_LENGTH) {
    return res.status(400).json({ error: 'Nome da criança/adolescente é obrigatório.' });
  }

  const cleanChildAge = child_age ? String(child_age).trim().slice(0, 10) : null;
  const cleanPhone = phone ? String(phone).trim().slice(0, 30) : null;

  try {
    const inserted = await sql`
      insert into appointments (responsible_name, child_name, child_age, phone)
      values (${cleanName}, ${cleanChildName}, ${cleanChildAge}, ${cleanPhone})
      returning id, status
    `;
    return res.status(201).json({ appointment: inserted[0] });
  } catch (err) {
    console.error('Erro ao criar agendamento:', err);
    return res.status(500).json({ error: 'Erro interno ao criar o agendamento.' });
  }
}

