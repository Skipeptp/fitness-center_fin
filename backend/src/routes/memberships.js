const router = require('express').Router();
const c = require('../controllers/membershipController');
const { authRequired } = require('../middleware/auth');
const { requireEmployee } = require('../middleware/roles');

router.get('/types',                           c.types);
router.post('/',              authRequired,    c.purchase);
router.get('/my',             authRequired,    c.my);
router.get('/client/:clientId', authRequired, requireEmployee, c.byClient);
router.patch('/:id/deactivate', authRequired, requireEmployee, c.deactivate);
router.get('/:id',            authRequired,    c.get);

module.exports = router;