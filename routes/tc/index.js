const router = require('koa-router')();
const { OnlyUnbannedUser, OnlyUser } = require('../../middlewares/permission');
router.get('/', OnlyUser(), async (ctx, next) => {
  const { db, data, query } = ctx;
  const { type } = query;
  if (type === 'thread') {
    data.categoryTree = await db.ThreadCategoryModel.getCategoryTree({
      source: 'thread',
      disabled: false,
    });
  } else if (type === 'article') {
    data.categoryTree = await db.ThreadCategoryModel.getCategoryTree({
      source: 'article',
      disabled: false,
    });
  }
  await next();
});
module.exports = router;
