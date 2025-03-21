const { getRandomString } = require('../../nkcModules/apiFunction');
const { jsApi } = require('../../nkcModules/wechatPay');
const wechatPayConfigs = require('../../config/wechatPay.json');
const { getPrivateKey } = require('../../nkcModules/wechatPay/utils');
const crypto = require('crypto');
const router = require('koa-router')();
const { Public } = require('../../middlewares/permission');
router.get('/', Public(), async (ctx, next) => {
  //此页面目前仅仅针对微信内置浏览器
  const { data, db, query } = ctx;
  const { code, state } = query;
  const userAgent = ctx.headers['user-agent'];
  // 检查是否在微信内置浏览器
  if (!userAgent || !userAgent.includes('MicroMessenger')) {
    ctx.throw(400, '不支持微信内置浏览器之外的访问');
  }
  if (!code) {
    ctx.throw(400, '参数有误');
  }
  // 通过id查询数据库中的记录
  const weChatPayRecord = await db.WechatPayRecordModel.findOne({ _id: state });
  if (!weChatPayRecord) {
    ctx.throw(400, '查询订单失败');
  }
  // 对于description后期可以根据不同的来源进行设置
  const prepay_id = await jsApi.getJsApiPaymentPrepayID({
    description: weChatPayRecord.description, //必填数据
    recordId: weChatPayRecord._id,
    money: weChatPayRecord.money,
    clientIp: weChatPayRecord.ip,
    attach: '{}',
    code,
  });
  //获取到用户的openId,并使用jsApi下单，获取prepay_id后重组数据返回。

  const nonceStr = getRandomString(`A0`, 32);
  const timeStamp = String(Math.floor(Date.now() / 1000));
  const packageId = `prepay_id=${prepay_id}`;
  const payString =
    wechatPayConfigs.appId +
    '\n' +
    timeStamp +
    '\n' +
    nonceStr +
    '\n' +
    packageId +
    '\n';
  // console.log('payString', payString);

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(Buffer.from(payString, 'utf-8'));
  const privateKey = await getPrivateKey();
  const paySign = sign.sign(privateKey, 'base64');
  data.info = {
    appId: wechatPayConfigs.appId,
    timeStamp,
    nonceStr,
    package: packageId,
    signType: 'RSA',
    paySign,
  };
  ctx.template = 'weChat/weChat.pug';
  await next();
});
module.exports = router;
