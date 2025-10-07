import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

export async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;
    
    const existingHost = await query(
      'SELECT id FROM hosts WHERE email = $1',
      [email]
    );
    
    if (existingHost.rows.length > 0) {
      return res.status(400).json({ error: 'Host already exists' });
    }
    
    const passwordHash = await bcrypt.hash(password, 12);
    
    const result = await query(
      'INSERT INTO hosts (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, passwordHash, name]
    );
    
    const token = jwt.sign(
      { hostId: result.rows[0].id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      token,
      host: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        name: result.rows[0].name
      }
    });
  } catch (err) {
    next(err);
  }
}


export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    
    const result = await query(
      'SELECT * FROM hosts WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const host = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, host.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { hostId: host.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      host: {
        id: host.id,
        email: host.email,
        name: host.name
      }
    });
  } catch (err) {
    next(err);
  }
}


export async function me(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ message: `Hello ${req.user.username}`, username: req.user.username });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  res.json({ message: 'Logged out' });
}
