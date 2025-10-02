import bcrypt from "bcrypt";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;
const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get("/", (req, res) => {
  res.json({ message: "Backend running" });
});

// Register new user
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'student' } = req.body;
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING user_id, email, first_name, last_name, role, created_at`,
      [email, password_hash, firstName, lastName, role]
    );
    
    res.json({ 
      success: true, 
      user: result.rows[0] 
    });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: "Registration failed" });
    }
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    const user = result.rows[0];
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    await pool.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1",
      [user.user_id]
    );
    
    delete user.password_hash;
    
    res.json({ 
      success: true, 
      user 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));