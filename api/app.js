require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.get("/", (req, res) => {
  res.send("Reconnect API is running!");
});

app.get("/employees", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM employees");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});
app.get("/employees/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM employees WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Employee not found");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});
app.post("/employees", async (req, res) => {
  try {
    const { name, department, salary } = req.body;

    const result = await pool.query(
      "INSERT INTO employees (name, department, salary) VALUES ($1, $2, $3) RETURNING *",
      [name, department, salary]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});
app.put("/employees/:id", async (req, res) => {
  try {
    const { name, department, salary } = req.body;

    const result = await pool.query(
      `UPDATE employees
       SET name = $1,
           department = $2,
           salary = $3
       WHERE id = $4
       RETURNING *`,
      [name, department, salary, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Employee not found");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});
app.delete("/employees/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM employees WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Employee not found");
    }

    res.send("Employee deleted");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
