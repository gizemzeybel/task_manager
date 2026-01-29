const db = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required." });

    const existing = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email);

    if (existing)
      return res.status(400).json({ message: "Email already exists." });

    const hash = bcrypt.hashSync(password, 10);

    const result = db
      .prepare(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)"
      )
      .run(name, email, hash);

    res.status(201).json({
      user: { id: result.lastInsertRowid, name, email },
    });
  } catch (err) {
    res.status(500).json({ message: "Register error", error: err.message });
  }
};

exports.login = (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email);

    if (!user)
      return res.status(400).json({ message: "Invalid credentials." });

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok)
      return res.status(400).json({ message: "Invalid credentials." });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
};
