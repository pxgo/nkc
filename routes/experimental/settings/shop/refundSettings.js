const Router = require('koa-router');
const { OnlyOperation } = require('../../../../middlewares/permission');
const { Operations } = require('../../../../settings/operations');
const router = new Router();
router
  .get(
    '/',
    OnlyOperation(Operations.visitShopRefundSettings),
    async (ctx, next) => {
      const { data, db } = ctx;
      const shopSettings = await db.SettingModel.findOnly({ _id: 'shop' });
      data.shopSettings = shopSettings.c;
      ctx.template = 'experimental/shop/refund/settings.pug';
      await next();
    },
  )
  .put(
    '/',
    OnlyOperation(Operations.modifyShopRefundSettings),
    async (ctx, next) => {
      const { db, body } = ctx;
      let {
        cert,
        sellerReceive,
        buyerReceive,
        agree,
        buyerTrack,
        sellerTrack,
        pay,
      } = body.shopSettings.refund;
      var checkNum = (num) => {
        num = Number(num);
        if (num > 0) {
          return num;
        } else {
          ctx.throw(400, '时间限制必须大于0');
        }
      };
      cert = checkNum(cert);
      sellerReceive = checkNum(sellerReceive);
      buyerReceive = checkNum(buyerReceive);
      agree = checkNum(agree);
      buyerTrack = checkNum(buyerTrack);
      sellerTrack = checkNum(sellerTrack);
      await db.SettingModel.updateOne(
        { _id: 'shop' },
        {
          $set: {
            'c.refund': {
              cert,
              sellerReceive,
              buyerReceive,
              agree,
              buyerTrack,
              sellerTrack,
              pay,
            },
          },
        },
      );
      await db.SettingModel.saveSettingsToRedis('shop');
      await next();
    },
  );
module.exports = router;
