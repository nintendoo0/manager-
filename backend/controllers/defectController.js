const { Pool } = require('pg');
const pool = new Pool();

async function createDefect(req, res) {
  const { title, description, priority, assignee, due_date } = req.body;
  if (!title || !priority) {
    return res.status(400).json({ message: 'Title and priority are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO defects (title, description, priority, assignee, due_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, priority, assignee, due_date, 'Новая']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating defect' });
  }
}

async function getDefects(req, res) {
  try {
    const result = await pool.query('SELECT * FROM defects ORDER BY due_date ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching defects' });
  }
}

async function updateDefect(req, res) {
  const { id } = req.params;
  const { title, description, priority, assignee, due_date, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE defects SET title=$1, description=$2, priority=$3, assignee=$4, due_date=$5, status=$6 WHERE id=$7 RETURNING *',
      [title, description, priority, assignee, due_date, status, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Defect not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating defect' });
  }
}

async function deleteDefect(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM defects WHERE id=$1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Defect not found' });
    }
    res.json({ message: 'Defect deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting defect' });
  }
}

module.exports = {
  createDefect,
  getDefects,
  updateDefect,
  deleteDefect,
};
