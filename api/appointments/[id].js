/**
 * PATCH /api/appointments/:id
 *
 * Atualiza o status de um agendamento (pendente → confirmado / cancelado).
 * PROTEGIDA: só a médica logada pode chamar esta rota.
 *
 * O "[id]" no nome do arquivo é uma convenção do Vercel: ele automaticamente
 * transforma qualquer parte da URL naquela posição em req.query.id.
 * Ex: PATCH /api/appointments/3f2e... → req.query.id === "3f2e..."
 */

const { sql } = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');

const VALID_STATUSES = ['pendente', 'confirmado', 'cancelado'];

module.exports = async (req, res) => {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const admin = await requireAuth(req, res);
  if (!admin) return;

  const { id } = req.query;
  const { status } = req.body || {};

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }

  try {
    const updated = await sql`
      update appointments
      set status = ${status}
      where id = ${id}
      returning id, appointment_date, appointment_time, status
    `;

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado.' });
    }

    return res.status(200).json({ appointment: updated[0] });
  } catch (err) {
    console.error('Erro ao atualizar agendamento:', err);
    return res.status(500).json({ error: 'Erro interno ao atualizar o agendamento.' });
  }
};
