const router = require('express').Router();
const c = require('../controllers/algorithmController');
router.get('/', c.home);
router.get('/random', c.random);
router.get('/algorithm/:slug', c.show);
module.exports = router;
