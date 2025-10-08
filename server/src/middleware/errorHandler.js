export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({ error: 'Resource already exists' });
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    return res.status(404).json({ error: 'Referenced resource not found' });
  }

  res.status(500).json({ error: 'Internal server error' });
};

export const notFound = (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
};