const { pool } = require('../config/db');
const { createNotification } = require('./notificationController');

// Get tasks (admin/supervisor see all, staff see assigned)
const getAllTasks = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT t.*, 
             u1.username as assigned_to_name, u1.full_name as assigned_to_fullname,
             u2.username as assigned_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.user_id
      LEFT JOIN users u2 ON t.assigned_by = u2.user_id
      WHERE 1=1
    `;
    const params = [];

    // Staff sees only their tasks
    if (req.user.role_name === 'staff') {
      query += ' AND t.assigned_to = ?';
      params.push(req.user.user_id);
    }

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    query += ' ORDER BY t.created_at DESC';

    const [tasks] = await pool.execute(query, params);
    res.json({ success: true, message: 'Tasks fetched.', data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks.', error: error.message });
  }
};

// Create task (admin/supervisor)
const createTask = async (req, res) => {
  try {
    const { title, description, assigned_to, priority, due_date } = req.body;
    if (!title || !assigned_to) {
      return res.status(400).json({ success: false, message: 'Title and assignee required.' });
    }

    const [result] = await pool.execute(
      `INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description || null, assigned_to, req.user.user_id, priority || 'medium', due_date || null]
    );

    // Log activity
    await pool.execute(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [req.user.user_id, 'CREATE', 'tasks', result.insertId, `Created task: ${title}`]
    );

    // Notify assignee
    await createNotification(
      assigned_to,
      'New Task Assigned',
      `You have been assigned a new task: ${title}${priority === 'high' || priority === 'urgent' ? ` (${priority.toUpperCase()} priority)` : ''}`,
      'system'
    );

    res.status(201).json({
      success: true,
      message: 'Task created.',
      data: { task_id: result.insertId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create task.', error: error.message });
  }
};

// Update task status (assignee or admin/supervisor)
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    // Verify access
    const [tasks] = await pool.execute(
      'SELECT t.*, u.username as assignee_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.user_id WHERE t.task_id = ?',
      [id]
    );
    if (tasks.length === 0) return res.status(404).json({ success: false, message: 'Task not found.' });

    const task = tasks[0];
    const isOwner = task.assigned_to === req.user.user_id;
    const isManager = ['admin', 'supervisor'].includes(req.user.role_name);
    if (!isOwner && !isManager) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await pool.execute(
      `UPDATE tasks SET status = ?, completed_at = ${status === 'completed' ? 'NOW()' : 'NULL'} WHERE task_id = ?`,
      [status, id]
    );

    // Log activity
    await pool.execute(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [req.user.user_id, 'UPDATE_STATUS', 'tasks', id, `Task "${task.title}" status changed to ${status}`]
    );

    // Notify task creator when staff completes a task
    if (status === 'completed' && isOwner && task.assigned_by && task.assigned_by !== req.user.user_id) {
      await createNotification(
        task.assigned_by,
        'Task Completed',
        `${req.user.username} completed task: ${task.title}`,
        'system'
      );
    }

    res.json({ success: true, message: 'Task status updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed.', error: error.message });
  }
};

// Update task (admin/supervisor)
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assigned_to, priority, due_date, status } = req.body;

    const [existing] = await pool.execute('SELECT * FROM tasks WHERE task_id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Task not found.' });

    const oldAssignee = existing[0].assigned_to;

    await pool.execute(
      `UPDATE tasks SET title = ?, description = ?, assigned_to = ?, priority = ?, due_date = ?, status = ?
       WHERE task_id = ?`,
      [title, description || null, assigned_to, priority, due_date || null, status, id]
    );

    // Log activity
    await pool.execute(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [req.user.user_id, 'UPDATE', 'tasks', id, `Updated task: ${title}`]
    );

    // Notify new assignee if reassigned
    if (oldAssignee !== assigned_to) {
      await createNotification(
        assigned_to,
        'Task Assigned to You',
        `You have been assigned task: ${title}`,
        'system'
      );
    }

    res.json({ success: true, message: 'Task updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed.', error: error.message });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT title FROM tasks WHERE task_id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Task not found.' });

    await pool.execute('DELETE FROM tasks WHERE task_id = ?', [id]);

    // Log activity
    await pool.execute(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [req.user.user_id, 'DELETE', 'tasks', id, `Deleted task: ${existing[0].title}`]
    );

    res.json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed.', error: error.message });
  }
};

module.exports = { getAllTasks, createTask, updateTaskStatus, updateTask, deleteTask };
