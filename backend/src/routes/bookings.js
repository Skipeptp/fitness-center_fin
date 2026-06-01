const router = require('express').Router();
const c = require('../controllers/bookingController');
const { authRequired } = require('../middleware/auth');
const { requireEmployee, requireClient } = require('../middleware/roles');

router.post('/',         authRequired, c.create);
router.delete('/:id',    authRequired, c.cancel);
router.get('/my',        authRequired, requireClient, c.my);
router.get('/',          authRequired, requireEmployee, c.all);

module.exports = router;