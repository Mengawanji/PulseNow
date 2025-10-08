import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth.js';
import sessionRoutes from './src/routes/sessions.js';
import pollRoutes from './src/routes/polls.js';
import { testConnection } from './config/database.js';
import { createTablesAndIndexes } from './config/init_db.js';

dotenv.config();

const app = express();

(async () => {
  try {
    await testConnection();
    await createTablesAndIndexes();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
  }
})();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/sessions', sessionRoutes);
app.use('/polls', pollRoutes);

app.use(notFound);
app.use(errorHandler);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});


export default app;
