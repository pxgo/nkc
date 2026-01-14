const Router = require('koa-router');
const router = new Router();
const publishRouter = require('./publish');
const authorRouter = require('./author');
router.use('/publish', publishRouter.routes(), publishRouter.allowedMethods());
router.use('/authors', authorRouter.routes(), authorRouter.allowedMethods());
module.exports = router;
