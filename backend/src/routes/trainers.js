const router = require('express').Router();
const c = require('../controllers/trainerController');
router.get('/',              c.list);
router.get('/:id',           c.get);
router.get('/:id/schedule',  c.schedule);
router.get('/:id/reviews',   c.reviews);
module.exports = router;
