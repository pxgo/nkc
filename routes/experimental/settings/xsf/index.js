const Router = require('koa-router');
const { OnlyOperation } = require('../../../../middlewares/permission');
const { Operations } = require('../../../../settings/operations');
const xsfRouter = new Router();
xsfRouter
  .get('/', OnlyOperation(Operations.visitXsfSettings), async (ctx, next) => {
    const { data, db } = ctx;
    data.xsfSettings = (await db.SettingModel.findOnly({ _id: 'xsf' })).c;
    ctx.template = 'experimental/settings/xsf.pug';
    await next();
  })
  .put('/', OnlyOperation(Operations.modifyXsfSettings), async (ctx, next) => {
    const { db, body } = ctx;
    const { addLimit, reduceLimit } = body.xsfSettings;
    if (addLimit <= 0) ctx.throw(400, '加学术分分值不能小于1');
    if (reduceLimit <= 0) ctx.throw(400, '减学术分分值不能小于1');
    await db.SettingModel.updateOne(
      { _id: 'xsf' },
      { $set: { 'c.addLimit': addLimit, 'c.reduceLimit': reduceLimit } },
    );
    await db.SettingModel.saveSettingsToRedis('xsf');
    await next();
  });
module.exports = xsfRouter;
