const Router = require('koa-router');
const orderRouter = new Router();
const refundRouter = require('./refund');
const cancelRouter = require('./cancel');
const {
  OnlyUnbannedUser,
  OnlyUser,
} = require('../../../middlewares/permission');
orderRouter
  .use('/', OnlyUser(), async (ctx, next) => {
    const { data } = ctx;
    data.active = 'order';
    await next();
  })
  // 发货
  .put('/sendGoods', OnlyUnbannedUser(), async (ctx, next) => {
    const { data, db, params, query, body } = ctx;
    const { orderId, trackNumber, trackName } = body.post;
    if (!orderId || !trackNumber) {
      ctx.throw(400, '请填写快递单号');
    }
    const order = await db.ShopOrdersModel.findOne({ orderId });
    if (!order) {
      ctx.throw(400, '订单无效');
    }
    var time = new Date();
    const shopSettings = await db.SettingModel.findOnly({ _id: 'shop' });
    const autoReceiveTime =
      Date.now() + shopSettings.c.refund.buyerReceive * 60 * 60 * 1000;
    await order.updateOne({
      $set: {
        trackName: trackName,
        trackNumber: trackNumber,
        orderStatus: 'unSign',
        shipToc: time,
        autoReceiveTime,
      },
    });
    await db.MessageModel.sendShopMessage({
      type: 'shopSellerShip',
      r: order.buyUid,
      orderId: order.orderId,
    });
    await next();
  })
  // 修改物流信息
  .put('/editGoods', OnlyUnbannedUser(), async (ctx, next) => {
    const { data, db, params, query, body } = ctx;
    const { orderId, trackNumber, trackName } = body.post;
    if (!orderId || !trackNumber) {
      ctx.throw(400, '请填写快递单号');
    }
    const order = await db.ShopOrdersModel.findOne({ orderId });
    if (!order) {
      ctx.throw(400, '订单无效');
    }
    await order.updateOne({
      $set: { trackName: trackName, trackNumber: trackNumber },
    });
    await next();
  })
  // 无物流发货
  .put('/sendGoodsNoLog', OnlyUnbannedUser(), async (ctx, next) => {
    const { data, db, params, query, body } = ctx;
    const { orderId } = body.post;
    const order = await db.ShopOrdersModel.findOne({ orderId });
    if (!order) {
      ctx.throw(400, '订单无效');
    }
    var time = new Date();
    const shopSettings = await db.SettingModel.findOnly({ _id: 'shop' });
    const autoReceiveTime =
      Date.now() + shopSettings.c.refund.buyerReceive * 60 * 60 * 1000;
    await order.updateOne({
      $set: {
        trackName: '',
        trackNumber: 'no',
        orderStatus: 'unSign',
        shipToc: time,
        autoReceiveTime,
      },
    });
    await next();
  })
  // 修改订单价格
  .put('/editOrder', OnlyUnbannedUser(), async (ctx, next) => {
    const { data, db, query, body } = ctx;
    const { user } = data;
    const { orderId, price } = body.post;
    if (!orderId) {
      ctx.throw(400, '订单号有误');
    }
    const order = await db.ShopOrdersModel.findOne({ orderId });
    if (!order) {
      ctx.throw(400, '未找到订单');
    }
    let orders = await db.ShopOrdersModel.storeExtendOrdersInfo([order]);
    data.order = orders[0];
    if (user.uid !== data.order.sellUid) {
      ctx.throw(400, '您无权修改此订单价格');
    }
    await order.updateOne({ $set: { orderPrice: price } });
    await next();
  })
  .put('/editOrderTrackNumber', OnlyUnbannedUser(), async (ctx, next) => {
    const { data, db, query, body } = ctx;
    const { user } = data;
    const { orderId, trackNumber } = body;
    if (!orderId) {
      ctx.throw(400, '订单号有误');
    }
    const order = await db.ShopOrdersModel.findOne({ orderId });
    if (
      !order ||
      order.orderStatus !== 'unSign' ||
      order.closeStatus == true ||
      order.refundStatus == 'success'
    ) {
      ctx.throw(400, '该状态订单不可修改运单号');
    }
    await order.updateOne({ $set: { trackNumber: trackNumber } });
    await next();
  })
  // 查看订单详情
  .get('/detail', OnlyUser(), async (ctx, next) => {
    const { data, db, params, query, nkcModules } = ctx;
    const { user } = data;
    const { orderId } = query;
    if (!orderId) {
      ctx.throw(400, '订单号有误');
    }
    const order = await db.ShopOrdersModel.findOne({ orderId });
    if (!order) {
      ctx.throw(404, '未找到订单');
    }
    let orders = await db.ShopOrdersModel.storeExtendOrdersInfo([order]);
    data.order = orders[0];
    // 获取订单凭证
    const certs = await db.ShopCertModel.find({ orderId });
    data.certs = certs;
    // 获取订单关闭原因
    const refund = await db.ShopRefundModel.findOne({ orderId })
      .sort({ _id: -1 })
      .limit(1);
    if (refund) {
      refund.description =
        ctx.state.lang('shopRefundStatus', refund.status) || refund.status;
    }
    data.refund = refund;
    if (data.order.sellUid !== user.uid) {
      ctx.throw(400, '您无权查看此订单详情');
    }
    ctx.template = 'shop/manage/detail.pug';
    await next();
  })
  // 查看订单物流详情
  .get('/logositics', OnlyUser(), async (ctx, next) => {
    const { data, db, query, body, nkcModules } = ctx;
    const { user } = data;
    const { orderId } = query;
    if (!orderId) {
      ctx.throw(400, '订单号有误');
    }
    const order = await db.ShopOrdersModel.findOne({ orderId });
    if (!order) {
      ctx.throw(400, '未找到该订单');
    }
    if (user.uid !== order.sellUid) {
      ctx.throw(400, '您无权查看该订单的物流信息');
    }
    if (!order.trackNumber) {
      ctx.throw(400, '暂无物流信息');
    }
    let trackNumber = await db.ShopOrdersModel.completeTrackNumber({
      trackNumber: order.trackNumber,
      trackName: order.trackName,
      receiveMobile: order.receiveMobile,
    });
    let trackName = order.trackName;
    const trackInfo = await nkcModules.apiFunction.getTrackInfo(
      trackNumber,
      trackName,
    );
    data.trackNumber = order.trackNumber;
    data.trackInfo = trackInfo;
    ctx.template = 'shop/manage/logositics.pug';
    await next();
  })
  // 修改订单卖家备注
  .put('/editSellMessage', OnlyUnbannedUser(), async (ctx, next) => {
    const { data, body, query, db } = ctx;
    const { sellMessage, orderId } = body;
    const order = await db.ShopOrdersModel.findOne({ orderId });
    if (!order) {
      ctx.throw(400, '未找到该订单');
    }
    if (sellMessage.length == 0) {
      ctx.throw(400, '卖家备注不可为空');
    }
    await order.updateOne({ $set: { sellMessage: sellMessage } });
    await next();
  })
  // 修改购买记录中的价格
  .put('/editCostRecord', OnlyUnbannedUser(), async (ctx, next) => {
    const { nkcModules, data, body, db } = ctx;
    const { type, costId, orderId, costObj, freightPrice } = body;
    const { user } = data;
    const order = await db.ShopOrdersModel.findOne({
      orderId,
      sellUid: user.uid,
    });
    if (!order) {
      ctx.throw(404, `订单不存在，orderId: ${orderId}`);
    }

    const { checkNumber } = nkcModules.checkData;
    let orderPrice = order.orderPrice;
    if (type === 'modifyParam') {
      const { singlePrice, count } = costObj;
      const costRecord = await db.ShopCostRecordModel.findOne({
        costId,
        orderId: order.orderId,
      });
      checkNumber(singlePrice, {
        name: '商品单价',
        min: 1,
      });
      checkNumber(count, {
        name: '商品数量',
        min: 1,
      });
      checkNumber(freightPrice, {
        name: '订单运费',
        min: 0,
      });
      costRecord.singlePrice = singlePrice;
      const reduce = costRecord.count - count;
      costRecord.count = count;
      await costRecord.save();
      // 修改库存
      if (reduce !== 0) {
        const product = await db.ShopGoodsModel.findOne({
          productId: costRecord.productId,
        });
        if (product.stockCostMethod === 'orderReduceStock') {
          const productParam = await db.ShopProductsParamModel.findOne({
            _id: costRecord.productParamId,
            productId: costRecord.productId,
          });
          await productParam.updateOne({
            $inc: {
              sellCount: -1 * reduce,
              stocksSurplus: reduce,
            },
          });
        }
      }
      const costs = await db.ShopCostRecordModel.find({
        orderId: order.orderId,
      });
      orderPrice = 0;
      costs.map((cost) => {
        const { count, singlePrice } = cost;
        orderPrice += count * singlePrice;
      });
    }
    await order.updateOne({ orderPrice, orderFreightPrice: freightPrice });
    await next();
  })
  /*.put('/editCostRecord', async (ctx, next) => {
		const {data, body, query, db} = ctx;
		const {costId, orderId, costObj, orderObj} = body;
		// 找出购买记录并修改
		const costRecord = await db.ShopCostRecordModel.findOne({costId});
		if(!costRecord) ctx.throw(400, "商品规格未找到");
		const {count, singlePrice} = costObj;
		await costRecord.updateOne({$set: {count, singlePrice}});
		// 找出订单并修改
		const order = await db.ShopOrdersModel.findOne({orderId});
		if(!order) ctx.throw(400, "订单未找到");
		const {orderFreightPrice, orderPrice} = orderObj;
		await order.updateOne({$set: {orderFreightPrice, orderPrice}});
		await next();
	})*/
  // 修改购买订单中的价格
  .put('/editOrderPrice', OnlyUnbannedUser(), async (ctx, next) => {
    const { data, body, query, db } = ctx;
    const { orderId, orderObj } = body;
    // 找出订单并修改
    const order = await db.ShopOrdersModel.findOne({ orderId });
    if (!order) {
      ctx.throw(400, '订单未找到');
    }
    const { orderFreightPrice, orderPrice } = orderObj;
    await order.updateOne({ $set: { orderFreightPrice, orderPrice } });
    await next();
  })
  // 订单导出
  .get('/orderListToExcel', OnlyUnbannedUser(), async (ctx, next) => {
    const { data, body, db, query } = ctx;
    const { user } = data;
    const { orderStartStamp, orderEndStamp } = query;
    let searchMap = { sellUid: user.uid };
    if (orderStartStamp && orderEndStamp) {
      searchMap = {
        orderToc: { $gt: orderStartStamp, $lt: orderEndStamp },
        sellUid: user.uid,
      };
    }
    // 订单数据查询
    let orderLists = await db.ShopOrdersModel.find(searchMap);
    data.orderLists = await db.ShopOrdersModel.storeExtendOrdersInfo(
      orderLists,
    );
    data.orderLists = await db.ShopOrdersModel.translateOrderStatus(
      data.orderLists,
    );
    ctx.template = 'shop/manage/orderList.pug';
    await next();
  })
  .use('/cancel', cancelRouter.routes(), cancelRouter.allowedMethods())
  .use('/refund', refundRouter.routes(), refundRouter.allowedMethods());
module.exports = orderRouter;
