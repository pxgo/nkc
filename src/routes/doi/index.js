const router = require('koa-router')();
const { Public } = require('../../middlewares/permission');

router.get('/', Public(), async (ctx, next) => {
  ctx.template = 'doi/home.pug';
  await next();
});

module.exports = router;
