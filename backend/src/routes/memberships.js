const router = require('express').Router();
const c = require('../controllers/membershipController');
const { authRequired } = require('../middleware/auth');
const { requireEmployee, requireClient } = require('../middleware/roles');

router.get('/types',                              c.types);
router.post('/',              authRequired,                    c.purchase);
router.get('/my',             authRequired, requireClient,     c.my);
router.get('/client/:clientId', authRequired, requireEmployee, c.byClient);
router.patch('/:id/deactivate', authRequired, requireEmployee, c.deactivate);
router.get('/:id',            authRequired,                    c.get);

module.exports = router;