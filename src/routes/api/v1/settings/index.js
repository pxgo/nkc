const Router = require('koa-router');
const router = new Router();
const publishRouter = require('./publish');
const authorRouter = require('./author');
const { referenceRouter } = require('./reference');
router.use('/publish', publishRouter.routes(), publishRouter.allowedMethods());
router.use('/authors', authorRouter.routes(), authorRouter.allowedMethods());
router.use(
  '/references',
  referenceRouter.routes(),
  referenceRouter.allowedMethods(),
);
module.exports = router;
