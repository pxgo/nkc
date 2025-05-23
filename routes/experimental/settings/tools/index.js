const Router = require('koa-router');
const { OnlyOperation } = require('../../../../middlewares/permission');
const { Operations } = require('../../../../settings/operations');
const router = new Router();

router
  // 查看工具列表
  .get('/', OnlyOperation(Operations.visitToolsManager), async (ctx, next) => {
    const { data, db, params } = ctx;

    // 网站工具列表
    let list = await db.ToolsModel.find().sort({ order: 1 });
    list.forEach((model, index) => {
      list[index] = model._doc;
    });
    data.list = list;

    const toolSettings = await db.SettingModel.getSettings('tools');
    data.siteToolEnabled = toolSettings.enabled;

    ctx.template = 'experimental/settings/tools/tools.pug';
    await next();
  });
module.exports = router;
