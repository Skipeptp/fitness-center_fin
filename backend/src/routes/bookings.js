const router = require('express').Router();
const c = require('../controllers/bookingController');
const { authRequired } = require('../middleware/auth');
const { requireEmployee } = require('../middleware/roles');

router.post('/',         authRequired, c.create);
router.delete('/:id',    authRequired, c.cancel);
router.get('/my',        authRequired, c.my);
router.get('/',          authRequired, requireEmployee, c.all);

module.exports = router;
