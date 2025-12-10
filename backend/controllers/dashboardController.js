const db = require('../config/db');

// Получение статистики дэшборда
exports.getDashboardStats = async (req, res) => {
  try {
    const user = req.user;

    // Общая статистика по проектам
    const projectsQuery = await db.query(
      'SELECT COUNT(*) as total, status FROM projects GROUP BY status'
    );

    // Общая статистика по дефектам
    const defectsQuery = await db.query(`
      SELECT 
        COUNT(*) as total,
        status,
        priority
      FROM defects 
      GROUP BY status, priority
    `);

    // Статистика по пользователям
    const usersQuery = await db.query(
      'SELECT COUNT(*) as total, role FROM users GROUP BY role'
    );

    // Дефекты по приоритетам
    const defectsByPriority = await db.query(`
      SELECT 
        priority,
        COUNT(*) as count
      FROM defects
      GROUP BY priority
    `);

    // Дефекты по статусам
    const defectsByStatus = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM defects
      GROUP BY status
    `);

    // Топ проектов с наибольшим количеством дефектов
    const topProjectsQuery = await db.query(`
      SELECT 
        p.id,
        p.name,
        COUNT(d.id) as defects_count,
        COUNT(CASE WHEN d.status = 'new' THEN 1 END) as new_defects,
        COUNT(CASE WHEN d.status = 'in_progress' THEN 1 END) as in_progress_defects,
        COUNT(CASE WHEN d.status = 'resolved' THEN 1 END) as resolved_defects,
        COUNT(CASE WHEN d.status = 'closed' THEN 1 END) as closed_defects
      FROM projects p
      LEFT JOIN defects d ON p.id = d.project_id
      GROUP BY p.id, p.name
      ORDER BY defects_count DESC
      LIMIT 10
    `);

    // Недавние дефекты
    const recentDefects = await db.query(`
      SELECT 
        d.id,
        d.title,
        d.priority,
        d.status,
        d.created_at,
        p.name as project_name,
        u.username as assigned_to_name
      FROM defects d
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN users u ON d.assigned_to = u.id
      ORDER BY d.created_at DESC
      LIMIT 10
    `);

    // Статистика по срокам (просроченные дефекты)
    const overdueDefects = await db.query(`
      SELECT COUNT(*) as count
      FROM defects
      WHERE deadline < CURRENT_DATE 
        AND status NOT IN ('resolved', 'closed')
    `);

    // Дефекты, назначенные текущему пользователю (если engineer)
    let myDefects = { rows: [] };
    if (user.role === 'engineer') {
      myDefects = await db.query(`
        SELECT 
          d.id,
          d.title,
          d.priority,
          d.status,
          d.deadline,
          p.name as project_name
        FROM defects d
        LEFT JOIN projects p ON d.project_id = p.id
        WHERE d.assigned_to = $1
        ORDER BY d.created_at DESC
        LIMIT 10
      `, [user.id]);
    }

    res.json({
      projects: {
        byStatus: projectsQuery.rows,
        total: projectsQuery.rows.reduce((acc, row) => acc + parseInt(row.total), 0)
      },
      defects: {
        byPriority: defectsByPriority.rows,
        byStatus: defectsByStatus.rows,
        total: defectsByStatus.rows.reduce((acc, row) => acc + parseInt(row.count), 0),
        overdue: parseInt(overdueDefects.rows[0]?.count || 0)
      },
      users: {
        byRole: usersQuery.rows,
        total: usersQuery.rows.reduce((acc, row) => acc + parseInt(row.total), 0)
      },
      topProjects: topProjectsQuery.rows,
      recentDefects: recentDefects.rows,
      myDefects: myDefects.rows
    });
  } catch (error) {
    console.error('Ошибка получения статистики дэшборда:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении статистики' });
  }
};

// Экспорт полного отчёта в CSV
exports.exportFullReport = async (req, res) => {
  try {
    const user = req.user;

    // Проверка прав (только admin и manager)
    if (!['admin', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    // Получаем все данные для отчёта
    const reportData = await db.query(`
      SELECT 
        d.id as defect_id,
        d.title as defect_title,
        d.description as defect_description,
        d.priority,
        d.status,
        d.created_at,
        d.deadline,
        p.name as project_name,
        p.status as project_status,
        creator.username as created_by,
        assigned.username as assigned_to,
        d.resolution_comment
      FROM defects d
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN users creator ON d.created_by = creator.id
      LEFT JOIN users assigned ON d.assigned_to = assigned.id
      ORDER BY d.created_at DESC
    `);

    // Формируем CSV
    const { Parser } = require('json2csv');
    const fields = [
      { label: 'ID дефекта', value: 'defect_id' },
      { label: 'Название', value: 'defect_title' },
      { label: 'Описание', value: 'defect_description' },
      { label: 'Приоритет', value: 'priority' },
      { label: 'Статус', value: 'status' },
      { label: 'Дата создания', value: 'created_at' },
      { label: 'Срок', value: 'deadline' },
      { label: 'Проект', value: 'project_name' },
      { label: 'Статус проекта', value: 'project_status' },
      { label: 'Создал', value: 'created_by' },
      { label: 'Назначен', value: 'assigned_to' },
      { label: 'Комментарий к решению', value: 'resolution_comment' }
    ];

    const json2csvParser = new Parser({ fields, withBOM: true });
    const csv = json2csvParser.parse(reportData.rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=full-report-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Ошибка экспорта отчёта:', error);
    res.status(500).json({ message: 'Ошибка при экспорте отчёта' });
  }
};

// Экспорт статистики дэшборда в CSV
exports.exportDashboardStats = async (req, res) => {
  try {
    const user = req.user;

    if (!['admin', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    // Получаем сводную статистику
    const statsData = await db.query(`
      SELECT 
        p.name as project_name,
        p.status as project_status,
        COUNT(d.id) as total_defects,
        COUNT(CASE WHEN d.status = 'new' THEN 1 END) as new_defects,
        COUNT(CASE WHEN d.status = 'in_progress' THEN 1 END) as in_progress_defects,
        COUNT(CASE WHEN d.status = 'resolved' THEN 1 END) as resolved_defects,
        COUNT(CASE WHEN d.status = 'closed' THEN 1 END) as closed_defects,
        COUNT(CASE WHEN d.priority = 'critical' THEN 1 END) as critical_defects,
        COUNT(CASE WHEN d.priority = 'high' THEN 1 END) as high_defects,
        COUNT(CASE WHEN d.priority = 'medium' THEN 1 END) as medium_defects,
        COUNT(CASE WHEN d.priority = 'low' THEN 1 END) as low_defects,
        COUNT(CASE WHEN d.deadline < CURRENT_DATE AND d.status NOT IN ('resolved', 'closed') THEN 1 END) as overdue_defects
      FROM projects p
      LEFT JOIN defects d ON p.id = d.project_id
      GROUP BY p.id, p.name, p.status
      ORDER BY total_defects DESC
    `);

    const { Parser } = require('json2csv');
    const fields = [
      { label: 'Проект', value: 'project_name' },
      { label: 'Статус проекта', value: 'project_status' },
      { label: 'Всего дефектов', value: 'total_defects' },
      { label: 'Новые', value: 'new_defects' },
      { label: 'В работе', value: 'in_progress_defects' },
      { label: 'Решённые', value: 'resolved_defects' },
      { label: 'Закрытые', value: 'closed_defects' },
      { label: 'Критичные', value: 'critical_defects' },
      { label: 'Высокий приоритет', value: 'high_defects' },
      { label: 'Средний приоритет', value: 'medium_defects' },
      { label: 'Низкий приоритет', value: 'low_defects' },
      { label: 'Просроченные', value: 'overdue_defects' }
    ];

    const json2csvParser = new Parser({ fields, withBOM: true });
    const csv = json2csvParser.parse(statsData.rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=dashboard-stats-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Ошибка экспорта статистики:', error);
    res.status(500).json({ message: 'Ошибка при экспорте статистики' });
  }
};
