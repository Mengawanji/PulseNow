
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import pollRoutes from './routes/polls.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { testConnection } from './config/database.js';
import { createTablesAndIndexes } from './config/init_db.js';



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


