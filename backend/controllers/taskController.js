const db = require("../db/db");

exports.getTasks = (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = db
      .prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC")
      .all(userId);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Get tasks error", error: err.message });
  }
};

exports.createTask = (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, status, due_date } = req.body;

    if (!title)
      return res.status(400).json({ message: "Title required." });

    const result = db
      .prepare(
        "INSERT INTO tasks (user_id, title, description, status, due_date) VALUES (?, ?, ?, ?, ?)"
      )
      .run(userId, title, description || "", status || "todo", due_date || null);

    const task = db
      .prepare("SELECT * FROM tasks WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: "Create task error", error: err.message });
  }
};

exports.updateTask = (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const { title, description, status, due_date } = req.body;

    const result = db
      .prepare(
        "UPDATE tasks SET title=?, description=?, status=?, due_date=? WHERE id=? AND user_id=?"
      )
      .run(title, description, status, due_date, taskId, userId);

    if (result.changes === 0)
      return res.status(404).json({ message: "Task not found." });

    const task = db
      .prepare("SELECT * FROM tasks WHERE id=?")
      .get(taskId);

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Update task error", error: err.message });
  }
};

exports.deleteTask = (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    const result = db
      .prepare("DELETE FROM tasks WHERE id=? AND user_id=?")
      .run(taskId, userId);

    if (result.changes === 0)
      return res.status(404).json({ message: "Task not found." });

    res.json({ message: "Task deleted." });
  } catch (err) {
    res.status(500).json({ message: "Delete task error", error: err.message });
  }
};
