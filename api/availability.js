/**
 * GET /api/availability?date=YYYY-MM-DD
 *
 * Rota pública (qualquer visitante do site pode chamar).
 * Recebe uma data e devolve só os HORÁRIOS já ocupados naquele dia —
 * nunca os nomes dos pacientes. É assim que o calendário no site sabe
 * quais botões de horário mostrar como "ocupado".
 */

const { sql } = require('../lib/db');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { date } = req.query;

  if (!date || !DATE_REGEX.test(date)) {
    return res.status(400).json({ error: 'Parâmetro "date" inválido. Use o formato YYYY-MM-DD.' });
  }

  try {
    const rows = await sql`
      select appointment_time
      from appointments
      where appointment_date = ${date}
        and status != 'cancelado'
    `;

    const takenTimes = rows.map((r) => r.appointment_time);
    return res.status(200).json({ date, takenTimes });
  } catch (err) {
    console.error('Erro ao buscar disponibilidade:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar horários disponíveis.' });
  }
};
