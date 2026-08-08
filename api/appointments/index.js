/**
 * /api/appointments
 *
 *  GET  → lista todos os agendamentos. PROTEGIDA: só a médica logada acessa.
 *  POST → cria um novo agendamento. PÚBLICA, mas com validação rigorosa
 *         e limite de tentativas por IP (evita spam/abuso).
 */

const { sql } = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');
const { checkAndRecordAttempt } = require('../../lib/rateLimit');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_TIMES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
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
      select id, appointment_date, appointment_time, responsible_name,
             child_name, status, created_at
      from appointments
      order by appointment_date asc, appointment_time asc
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
  const { appointment_date, appointment_time, responsible_name, child_name, phone } = req.body || {};

  if (!appointment_date || !DATE_REGEX.test(appointment_date)) {
    return res.status(400).json({ error: 'Data inválida.' });
  }

  // Confere se a data é realmente um sábado e não é uma data passada.
  const [year, month, day] = appointment_date.split('-').map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  const isSaturday = dateObj.getUTCDay() === 6;
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);

  if (!isSaturday) {
    return res.status(400).json({ error: 'Só é possível agendar aos sábados.' });
  }
  if (dateObj < todayUTC) {
    return res.status(400).json({ error: 'Não é possível agendar em uma data passada.' });
  }

  if (!appointment_time || !ALLOWED_TIMES.includes(appointment_time)) {
    return res.status(400).json({ error: 'Horário inválido.' });
  }

  const cleanName = (responsible_name || '').trim();
  if (!cleanName || cleanName.length > MAX_NAME_LENGTH) {
    return res.status(400).json({ error: 'Nome do responsável é obrigatório.' });
  }

  const cleanChildName = child_name ? String(child_name).trim().slice(0, MAX_NAME_LENGTH) : null;
  const cleanPhone = phone ? String(phone).trim().slice(0, 30) : null;

  // 3) Inserção no banco. Se o horário já estiver ocupado, o próprio banco
  // recusa (por causa do "unique_active_slot" criado no schema.sql) —
  // isso é o que garante que dois pais nunca consigam marcar o mesmo
  // horário mesmo clicando ao mesmo tempo.
  try {
    const inserted = await sql`
      insert into appointments (appointment_date, appointment_time, responsible_name, child_name, phone)
      values (${appointment_date}, ${appointment_time}, ${cleanName}, ${cleanChildName}, ${cleanPhone})
      returning id, appointment_date, appointment_time, status
    `;
    return res.status(201).json({ appointment: inserted[0] });
  } catch (err) {
    if (err.code === '23505') {
      // "unique_violation" do Postgres — alguém marcou esse horário um instante antes.
      return res.status(409).json({ error: 'Esse horário acabou de ser preenchido por outra pessoa.' });
    }
    console.error('Erro ao criar agendamento:', err);
    return res.status(500).json({ error: 'Erro interno ao criar o agendamento.' });
  }
}
