const { validationResult } = require('express-validator');

// Запускается после набора правил (body/param/query) - возвращает 422 при ошибках
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: 'Validation error',
      details: errors.array().map(e => ({ field: e.path, msg: e.msg }))
    });
  }
  next();
};

module.exports = { handleValidation };
