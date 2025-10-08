const { Parser } = require('json2csv');
const db = require('../config/db'); // ваш модуль db.query

exports.exportDefectsCsv = async (req, res) => {
  try {
    // Проверяем роль пользователя — только admin/manager
    const user = req.user;
    if (!user || !['admin', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    // Читаем фильтры из query
    const { project_id, status, priority, assigned_to, from_date, to_date, search } = req.query;

    // Собираем WHERE динамически (пример для postgres)
    const where = [];
    const params = [];
    let idx = 1;
    if (project_id) { where.push(`d.project_id = $${idx++}`); params.push(project_id); }
    if (status) { where.push(`d.status = $${idx++}`); params.push(status); }
    if (priority) { where.push(`d.priority = $${idx++}`); params.push(priority); }
    if (assigned_to) { where.push(`d.assigned_to = $${idx++}`); params.push(assigned_to); }
    if (from_date) { where.push(`d.created_at >= $${idx++}`); params.push(from_date); }
    if (to_date) { where.push(`d.created_at <= $${idx++}`); params.push(to_date); }
    if (search) {
      where.push(`(LOWER(d.title) LIKE $${idx} OR LOWER(d.description) LIKE $${idx})`);
      params.push(`%${String(search).toLowerCase()}%`);
      idx++;
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const sql = `
      SELECT d.id, d.title, d.description, d.priority, d.status, d.project_id, p.name as project_name,
             d.assigned_to as assigned_to_id, u.username as assigned_to_name, d.created_at, d.deadline
      FROM defects d
      LEFT JOIN projects p ON p.id = d.project_id
      LEFT JOIN users u ON u.id = d.assigned_to
      ${whereSql}
      ORDER BY d.created_at DESC
    `;

    const result = await db.query(sql, params);
    const rows = result.rows || [];

    // Поля CSV и заголовки (русские)
    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Название', value: 'title' },
      { label: 'Описание', value: 'description' },
      { label: 'Приоритет', value: 'priority' },
      { label: 'Статус', value: 'status' },
      { label: 'Проект', value: 'project_name' },
      { label: 'Исполнитель', value: 'assigned_to_name' },
      { label: 'Дата создания', value: row => row.created_at ? new Date(row.created_at).toISOString() : '' },
      { label: 'Дедлайн', value: row => row.deadline ? new Date(row.deadline).toISOString() : '' }
    ];

    const parser = new Parser({ fields, withBOM: true });
    const csv = parser.parse(rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="defects_report_${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error('exportDefectsCsv error', err);
    return res.status(500).json({ message: 'Ошибка генерации CSV', error: err.message });
  }
};