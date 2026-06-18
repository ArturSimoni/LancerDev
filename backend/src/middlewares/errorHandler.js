module.exports = (err, req, res, next) => {
  console.error('❌ Erro capturado pela API:', err.message || err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    error: err.message || 'Erro interno do servidor',
    details: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
};