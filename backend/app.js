const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "secret",
  database: process.env.DB_NAME || "mydb",
  port: 5432,
});

// 🔁 Wait for DB to be ready
const initDB = async () => {
  let retries = 5;

  while (retries) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          name TEXT
        );
      `);

      console.log("✅ DB Ready");
      break;

    } catch (err) {
      console.log("⏳ DB not ready, retrying...");
      retries--;
      await new Promise(res => setTimeout(res, 3000));
    }
  }
};

initDB();

// ❤️ Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// ➕ Insert data
app.post("/data", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    await pool.query(
      "INSERT INTO tasks(name) VALUES($1)",
      [name]
    );

    res.json({ message: "Inserted" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 📋 Get all data
app.get("/data", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tasks ORDER BY id ASC");
    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔍 Get specific data by ID
app.get("/data/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM tasks WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🚀 Start server
app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});