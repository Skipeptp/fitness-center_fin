const router = require('express').Router();
const c = require('../controllers/membershipController');
const { authRequired } = require('../middleware/auth');

router.get('/types',          c.types);
router.post('/',     authRequired, c.purchase);
router.get('/my',    authRequired, c.my);
router.get('/:id',   authRequired, c.get);

module.exports = router;
