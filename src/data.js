const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

// Database connection
const pool = new Pool({
  user: 'your_db_user',
  host: 'localhost',
  database: 'your_db_name',
  password: 'your_db_password',
  port: 5432,
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 1. Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // 2. Insert into database
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [username, email, hashedPassword]
    );
    
    // 3. Update metadata
    await pool.query(
      'UPDATE user_metadata SET total_users = total_users + 1, last_updated = NOW()'
    );
    
    // 4. Return JSON response
    res.status(201).json({
      success: true,
      user: {
        id: newUser.rows[0].id,
        username: newUser.rows[0].username,
        email: newUser.rows[0].email,
        signup_date: newUser.rows[0].signup_date
      },
      metadata: {
        total_users: (await pool.query('SELECT total_users FROM user_metadata')).rows[0].total_users,
        last_updated: (await pool.query('SELECT last_updated FROM user_metadata')).rows[0].last_updated
      }
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get users endpoint
app.get('/api/users', async (req, res) => {
  try {
    const users = await pool.query('SELECT id, username, email, signup_date FROM users');
    const metadata = await pool.query('SELECT total_users, last_updated FROM user_metadata');
    
    res.json({
      users: users.rows,
      metadata: metadata.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));