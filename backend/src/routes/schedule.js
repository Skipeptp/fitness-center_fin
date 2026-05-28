const router = require('express').Router();
const c = require('../controllers/scheduleController');
const { authRequired, authOptional } = require('../middleware/auth');
const { requireEmployee } = require('../middleware/roles');

router.get('/',     authOptional, c.list);
router.get('/week', authOptional, c.week);
router.get('/:id',  authOptional, c.get);

router.post('/',       authRequired, requireEmployee, c.create);
router.put('/:id',     authRequired, requireEmployee, c.update);
router.delete('/:id',  authRequired, requireEmployee, c.remove);

module.exports = router;
