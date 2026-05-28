// Централизованный обработчик ошибок
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.stack || err);
  const code = err.statusCode || 500;
  res.status(code).json({
    success: false,
    error: err.publicMessage || (code === 500 ? 'Internal server error' : err.message)
  });
};

module.exports = errorHandler;
