export const notFound = (req, res, _next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, _next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages[0], errors: messages });
  }

  if (err.code === 11000) {
    return res.status(400).json({ success: false, message: 'Duplicate value for a unique field' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid identifier format' });
  }

  const status = err.statusCode || 500;
  return res.status(status).json({
    success: false,
    message: err.message || 'Server error',
  });
};