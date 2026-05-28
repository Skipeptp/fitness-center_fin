const router = require('express').Router();
const { body } = require('express-validator');
const c = require('../controllers/authController');
const { handleValidation } = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

router.post('/register', [
  body('first_name').isString().isLength({ min: 1, max: 100 }),
  body('last_name').isString().isLength({ min: 1, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/[A-Za-z]/).matches(/[0-9]/)
    .withMessage('min 8 chars, letters + digits'),
  handleValidation
], c.register);

// login - принимает (login|email) + password + type?
// type: 'client' (default) | 'employee'
router.post('/login', loginLimiter, [
  body('password').isString().isLength({ min: 1 }),
  handleValidation
], c.login);

router.post('/refresh', c.refresh);
router.post('/logout',  c.logout);
router.get('/me', authRequired, c.me);

module.exports = router;
