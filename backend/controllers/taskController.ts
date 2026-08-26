import { RequestHandler } from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';
import { createNotification } from './notificationController';

// Get tasks (admin/supervisor see all, staff see assigned)
const getAllTasks: RequestHandler = async (req, res) => {
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
    const params: any[] = [];

    // Staff sees only their tasks
    if (req.user!.role_name === 'staff') {
      query += ' AND t.assigned_to = ?';
      params.push(req.user!.user_id);
    }

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    query += ' ORDER BY t.created_at DESC';

    const [tasks] = await pool.execute<RowDataPacket[]>(query, params);
    res.json({ success: true, message: 'Tasks fetched.', data: tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Create task (admin/supervisor)
const createTask: RequestHandler = async (req, res) => {
  try {
    const { title, description, assigned_to, priority, due_date } = req.body;
    if (!title || !assigned_to) {
      return res.status(400).json({ success: false, message: 'Title and assignee required.' });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description || null, assigned_to, req.user!.user_id, priority || 'medium', due_date || null]
    );

    // Log activity
    await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [req.user!.user_id, 'CREATE', 'tasks', result.insertId, `Created task: ${title}`]
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create task.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Update task status (assignee or admin/supervisor)
const updateTaskStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    // Verify access
    const [tasks] = await pool.execute<RowDataPacket[]>(
      'SELECT t.*, u.username as assignee_name, u2.username as assigner_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.user_id LEFT JOIN users u2 ON t.assigned_by = u2.user_id WHERE t.task_id = ?',
      [id]
    );
    if (tasks.length === 0) return res.status(404).json({ success: false, message: 'Task not found.' });

    const task = tasks[0];
    const isOwner = task.assigned_to === req.user!.user_id;
    const isAssigner = task.assigned_by === req.user!.user_id;
    const isAdmin = req.user!.role_name === 'admin';

    // Prevent unchecking completed tasks unless you're the owner, assigner, or admin
    if (task.status === 'completed' && req.body.status !== 'completed' && !isOwner && !isAssigner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the task assignee, assigner, or admin can change a completed task.' });
    }

    // General access check: owner, assigner, admin, or supervisor can update tasks
    const isManager = ['admin', 'supervisor'].includes(req.user!.role_name);
    if (!isOwner && !isAssigner && !isAdmin && !isManager) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await pool.execute<ResultSetHeader>(
      `UPDATE tasks SET status = ?, completed_at = ${status === 'completed' ? 'NOW()' : 'NULL'} WHERE task_id = ?`,
      [status, id]
    );

    // Log activity
    await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [req.user!.user_id, 'UPDATE_STATUS', 'tasks', id, `Task "${task.title}" status changed to ${status}`]
    );

    // Notify task creator when staff completes a task
    if (status === 'completed' && isOwner && task.assigned_by && task.assigned_by !== req.user!.user_id) {
      await createNotification(
        task.assigned_by,
        'Task Completed',
        `${req.user!.username} completed task: ${task.title}`,
        'system'
      );
    }

    res.json({ success: true, message: 'Task status updated.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Update task (admin/supervisor)
const updateTask: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assigned_to, priority, due_date, status } = req.body;

    const [existing] = await pool.execute<RowDataPacket[]>('SELECT * FROM tasks WHERE task_id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Task not found.' });

    const oldAssignee = existing[0].assigned_to;

    // Validate payload before touching the row; only validate provided fields
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }
    if (priority !== undefined && !validPriorities.includes(priority)) {
      return res.status(400).json({ success: false, message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}.` });
    }
    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.` });
    }
    if (assigned_to !== undefined && assigned_to !== null) {
      const [assignee] = await pool.execute<RowDataPacket[]>('SELECT user_id FROM users WHERE user_id = ?', [assigned_to]);
      if (assignee.length === 0) {
        return res.status(400).json({ success: false, message: 'Assignee not found.' });
      }
    }

    await pool.execute<ResultSetHeader>(
      `UPDATE tasks SET title = ?, description = ?, assigned_to = ?, priority = ?, due_date = ?, status = ?
       WHERE task_id = ?`,
      [
        title ?? existing[0].title,
        description !== undefined ? (description || null) : existing[0].description,
        assigned_to !== undefined ? assigned_to : oldAssignee,
        priority ?? existing[0].priority,
        due_date !== undefined ? (due_date || null) : existing[0].due_date,
        status ?? existing[0].status,
        id
      ]
    );

    // Log activity
    await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [req.user!.user_id, 'UPDATE', 'tasks', id, `Updated task: ${title}`]
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Delete task
const deleteTask: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute<RowDataPacket[]>('SELECT title FROM tasks WHERE task_id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Task not found.' });

    await pool.execute<ResultSetHeader>('DELETE FROM tasks WHERE task_id = ?', [id]);

    // Log activity
    await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)`,
      [req.user!.user_id, 'DELETE', 'tasks', id, `Deleted task: ${existing[0].title}`]
    );

    res.json({ success: true, message: 'Task deleted.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export { getAllTasks, createTask, updateTaskStatus, updateTask, deleteTask };