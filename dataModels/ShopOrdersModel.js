/*
  商品订单表
  @author Kris 2019/2/22
*/
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const orderStatus = {
  unCost: 'unCost', // 待付款
  unShip: 'unShip', // 待发货
  unSign: 'unSign', // 待收货
  finish: 'finish', // 完成
};
const shopOrdersSchema = new Schema(
  {
    // 订单id
    orderId: {
      type: String,
      index: 1,
      required: true,
    },
    freightName: {
      type: String,
      default: '',
    },
    // 商品id
    // productId: {
    //   type: String,
    //   index: 1
    // },
    // 规格id
    // paramId: {
    //   type: String,
    //   index: 1
    // },
    // 商品规格
    // params: {
    //   type: Array,
    //   default: []
    // },
    // 购买快照(不可调用，不可修改，只用来追溯查看)
    snapshot: {
      type: Array,
      default: [],
    },
    // 买家uid
    buyUid: {
      type: String,
      required: true,
    },
    // 卖家uid
    sellUid: {
      type: String,
      required: true,
    },
    // 数量
    // count: {
    //   type: Number,
    //   default: 1
    // },
    // 订单原始总价
    // orderOriginPrice: {
    //   type: Number
    // },
    // 订单运费
    orderFreightPrice: {
      type: Number,
      default: 0,
    },
    // 订单总价格
    orderPrice: {
      type: Number,
      default: 0,
    },
    // 收货地址
    receiveAddress: {
      type: String,
      default: '',
    },
    // 收货人姓名
    receiveName: {
      type: String,
      default: '',
    },
    // 收货人电话
    receiveMobile: {
      type: String,
      default: '',
    },
    // 下单时间(订单生成时间)
    orderToc: {
      type: Date,
      default: Date.now,
    },
    // 付款时间
    payToc: {
      type: Date,
      default: null,
    },
    // 发货时间
    shipToc: {
      type: Date,
      default: null,
    },
    // 完成时间
    finishToc: {
      type: Date,
      default: null,
    },
    // 取消订单时间
    closeToc: {
      type: Date,
      default: null,
    },
    /**
     * 订单状态
     * @待付款 unCost
     * @待发货 unShip
     * @待收货 unSign
     * @订单完成 finish
     */
    orderStatus: {
      type: String,
      default: orderStatus.unCost,
    },
    // 自动收货的时间
    autoReceiveTime: {
      type: Number,
      default: 0,
      index: 1,
    },
    // 异常订单
    error: {
      type: String,
      default: '',
      index: 1,
    },
    // 买家留言
    buyMessage: {
      type: String,
      default: '',
    },
    // 卖家备注
    sellMessage: {
      type: String,
      default: '',
    },
    /**
     * 退款状态
     * @ing 正在退款中
     * @success 退款已成功
     * @fail 退款已失败
     * @null 没有退款行为
     */
    refundStatus: {
      type: String,
      default: null,
    },
    /**
     * 订单是否关闭
     */
    closeStatus: {
      type: Boolean,
      default: false,
    },
    /**
     * 快递单号
     */
    trackNumber: {
      type: String,
      default: '',
    },
    /**
     * 快递公司简称
     * AUTO为自动匹配
     */
    trackName: {
      type: String,
      default: 'AUTO',
    },
    // 用于判断买家是否可以请求平台介入
    applyToPlatform: {
      type: Boolean,
      default: false,
    },
    // 退款金额
    refundMoney: {
      type: Number,
      default: 0,
    },
  },
  {
    collection: 'shopOrders',
    toObject: {
      getters: true,
      virtuals: true,
    },
  },
);
// 虚拟属性 凭证对象数组
shopOrdersSchema
  .virtual('certs')
  .get(function () {
    return this._certs;
  })
  .set(function (certs) {
    this._certs = certs;
  });

/**
 * 商家拓展订单信息
 * @param orders 由订单对象组成的数组
 * @param o:
 *  参数            数据类型(默认值)      介绍
 *  user:           Boolean(true)   是否拓展购买者信息
 *  product:        Boolean(true)   是否拓展商品信息
 *  productParams:  Boolean(true)   是否拓展商品规格信息
 * @return 拓展后的对象数组，此时的商品对象已不再是schema对象，故无法调用model中的方法
 * @author Kris 2019-3-15
 */
shopOrdersSchema.statics.storeExtendOrdersInfo = async (orders, o) => {
  if (!o) {
    o = {};
  }
  let options = {
    sellUser: true,
    buyUser: true,
    product: true,
    productParam: true,
    params: true,
    certs: true,
  };
  o = Object.assign(options, o);
  const UserModel = mongoose.model('users');
  const ShopCostRecord = mongoose.model('shopCostRecord');
  const ShopGoodsModel = mongoose.model('shopGoods');
  const ShopCertModel = mongoose.model('shopCerts');
  const ShopProductsParamsModel = mongoose.model('shopProductsParams');
  const sellUid = new Set(),
    sellUserObj = {};
  const buyUid = new Set(),
    buyUserObj = {};
  const orderId = new Set(),
    paramsObj = {};
  const certsObj = {};
  orders.map((ord) => {
    if (o.sellUser) {
      sellUid.add(ord.sellUid);
    }
    if (o.buyUser) {
      buyUid.add(ord.buyUid);
    }
    if (o.params) {
      orderId.add(ord.orderId);
    }
  });
  let sellUsers, buyUsers, products, productParams, params;
  if (o.sellUser) {
    sellUsers = await UserModel.find({ uid: { $in: [...sellUid] } });
    for (const sellUser of sellUsers) {
      sellUserObj[sellUser.uid] = sellUser;
    }
  }
  if (o.buyUser) {
    buyUsers = await UserModel.find({ uid: { $in: [...buyUid] } });
    for (const buyUser of buyUsers) {
      buyUserObj[buyUser.uid] = buyUser;
    }
  }
  if (o.certs) {
    const certs = await ShopCertModel.find({ orderId: { $in: [...orderId] } });
    certs.map((cert) => {
      certsObj[cert.orderId] = certsObj[cert.orderId] || [];
      certsObj[cert.orderId].push(cert);
    });
  }
  if (o.params) {
    params = await ShopCostRecord.find({ orderId: { $in: [...orderId] } });
    params = await ShopCostRecord.orderExtendRecord(params);
    for (const param of params) {
      if (!paramsObj[param.orderId]) {
        paramsObj[param.orderId] = [];
      }
      paramsObj[param.orderId].push(param);
    }
  }
  return await Promise.all(
    orders.map((ord) => {
      let order;
      if (ord.toObject) {
        order = ord.toObject();
      } else {
        order = ord;
      }

      if (o.sellUser) {
        order.sellUser = sellUserObj[ord.sellUid];
      }
      if (o.buyUser) {
        order.buyUser = buyUserObj[ord.buyUid];
      }
      if (o.params) {
        order.params = paramsObj[ord.orderId];
      }

      if (o.certs) {
        order.certs = certsObj[order.orderId] || [];
      }

      return order;
    }),
  );
};

/**
 * 买家拓展订单信息
 * @param orders 由订单组成的数组
 * @param o:
 *  参数  数据类型(默认值)    介绍
 *  product:Boolean(true)   是否拓展商品信息
 *  productParams:Boolean(true) 是否拓展商品规格信息
 * @return 拓展后，对象已不再是schema对象，故无法调用model中的方法
 */
shopOrdersSchema.statics.userExtendOrdersInfo = async (orders, o) => {
  if (!o) {
    o = {};
  }
  let options = {
    product: false,
    sellUser: true,
    buyUser: true,
    params: true,
    certs: true,
  };
  o = Object.assign(options, o);
  const ShopGoodsModel = mongoose.model('shopGoods');
  const ShopProductsParamsModel = mongoose.model('shopProductsParams');
  const ShopCertModel = mongoose.model('shopCerts');
  const UserModel = mongoose.model('users');
  const ShopCostRecord = mongoose.model('shopCostRecord');
  const productId = new Set(),
    productObj = {};
  // const paramId = new Set(), productParamObj = {};
  const sellUid = new Set(),
    sellUserObj = {};
  const buyUid = new Set(),
    buyUserObj = {};
  const orderId = new Set(),
    paramsObj = {};
  const certsObj = {};
  orders.map((ord) => {
    if (o.product) {
      productId.add(ord.productId);
    }
    if (o.productParam) {
      paramId.add(ord.paramId);
    }
    if (o.sellUser) {
      sellUid.add(ord.sellUid);
    }
    if (o.buyUser) {
      buyUid.add(ord.buyUid);
    }
    if (o.params) {
      orderId.add(ord.orderId);
    }
  });
  let products, sellUsers, buyUsers, params;
  if (o.product) {
    products = await ShopGoodsModel.find({
      productId: { $in: [...productId] },
    });
    products = await ShopGoodsModel.extendProductsInfo(products);
    for (const product of products) {
      productObj[product.productId] = product;
    }
  }
  // if(o.productParam) {
  //   productParams = await ShopProductsParamsModel.find({_id: {$in:[...paramId]}});
  //   productParams = await ShopProductsParamsModel.extendParamsInfo(productParams);
  //   for(const productParam of productParams) {
  //     productParamObj[productParam._id] = productParam
  //   }
  // }
  if (o.sellUser) {
    sellUsers = await UserModel.find({ uid: { $in: [...sellUid] } });
    for (const sellUser of sellUsers) {
      sellUserObj[sellUser.uid] = sellUser;
    }
  }
  if (o.buyUser) {
    buyUsers = await UserModel.find({ uid: { $in: [...buyUid] } });
    for (const buyUser of buyUsers) {
      buyUserObj[buyUser.uid] = buyUser;
    }
  }
  if (o.params) {
    params = await ShopCostRecord.find({ orderId: { $in: [...orderId] } });
    params = await ShopCostRecord.orderExtendRecord(params);
    for (const param of params) {
      if (!paramsObj[param.orderId]) {
        paramsObj[param.orderId] = [];
      }
      paramsObj[param.orderId].push(param);
    }
  }
  if (o.certs) {
    const certs = await ShopCertModel.find({ orderId: { $in: [...orderId] } });
    certs.map((cert) => {
      certsObj[cert.orderId] = certsObj[cert.orderId] || [];
      certsObj[cert.orderId].push(cert);
    });
  }
  return await Promise.all(
    orders.map((ord) => {
      const order = ord.toObject();
      if (o.product) {
        order.product = productObj[ord.productId];
      }
      // if(o.productParam) order.productParam = productParamObj[ord.paramId];
      if (o.sellUser) {
        order.sellUser = sellUserObj[ord.sellUid];
      }
      if (o.buyUser) {
        order.buyUser = buyUserObj[ord.buyUid];
      }
      if (o.params) {
        order.params = paramsObj[ord.orderId];
      }
      if (o.certs) {
        order.certs = certsObj[order.orderId] || [];
      }
      return order;
    }),
  );
};
/*
  获取多个订单的信息，包括：订单名（多个商品名拼接）、订单介绍、订单价格（总计）、订单ID数组
  @param orders: 订单对象数组
  @return obj:
    name: 订单名
    description: 订单介绍
    totalMoney: 总价格
    ordersId: 订单ID
  @author pengxiguaa 2019/3/20
*/
shopOrdersSchema.statics.getOrdersInfo = async (orders) => {
  const ShopOrdersModel = mongoose.model('shopOrders');
  orders = await ShopOrdersModel.storeExtendOrdersInfo(orders);
  let titles = [];
  const ordersId = [];
  let totalMoney = 0;
  for (const o of orders) {
    for (const c of o.params) {
      let title = '';
      let needAdd = true;
      if (needAdd) {
        const old = title;
        title += `${c.count}*${c.product.name}(${c.productParam.name}) `;
        if (title.length >= 150) {
          needAdd = false;
          title = old + '...';
        }
      }
      titles.push(title);
    }
    ordersId.push(o.orderId);
    totalMoney += o.orderPrice + o.orderFreightPrice;
  }
  return {
    description: titles,
    totalMoney,
    ordersId,
  };
};
/*
  构造查询条件
  @param q: 自定义查询条件
  @return 查询对象
  @author pengxiguaa 2019/3/21
 */
shopOrdersSchema.statics.getQueryData = async (q) => {
  return Object.assign(
    {
      closeStatus: false,
    },
    q,
  );
};

/*
  处理超过30分钟未付款的订单
  @param uid: 用户ID
  @author pengxiguaa 2019/3/21
*/
shopOrdersSchema.statics.clearTimeoutOrders = async (uid) => {
  const now = Date.now();
  await mongoose.model('shopOrders').updateMany(
    {
      uid,
      toc: {
        $lt: now - 30 * 60 * 1000,
      },
      closeStatus: false,
      orderStatus: 'unCost',
    },
    {
      $set: {
        closeStatus: true,
        closeToc: now,
      },
    },
  );
};

/**
 * 检测是否只能进行全部退款
 * 全部退款条件：
 * 1.params中只有一个商品规格处于未退款状态,refundStatus == ""
 */
shopOrdersSchema.statics.checkRefundCanBeAll = async (orders) => {
  return orders.map((o) => {
    let order;
    if (o.toObject) {
      order = o.toObject();
    } else {
      order = o;
    }
    const { params } = order;
    let paramRefundCount = 0;
    for (let a = 0; a < params.length; a++) {
      if (params.refundStatus && params.refundStatus !== '') {
        paramRefundCount++;
      }
    }
    if (params.length - paramRefundCount == 1) {
      order.mustAllRefund = true;
    } else {
      order.mustAllRefund = false;
    }
    return order;
  });
};

/*
  翻译订单当前所处的状态，会在订单对象上添加”status“属性，值为订单状态字符串
  @param orders: 订单对象所组成的数组
  @author pengxiguaa 2019/3/21
*/
shopOrdersSchema.statics.translateOrderStatus = async (orders) => {
  return orders.map((o) => {
    let order;
    if (o.toObject) {
      order = o.toObject();
    } else {
      order = o;
    }
    const { orderStatus, closeStatus, refundStatus } = order;
    let refund = '';
    if (refundStatus === 'ing') {
      refund = '(退款中)';
    } else if (refundStatus === 'success') {
      refund = '(退款成功)';
    } else if (refundStatus === 'fail') {
      refund = '(退款失败)';
    }
    if (closeStatus) {
      order.status = '已关闭';
    } else {
      switch (orderStatus) {
        case 'unCost':
          order.status = '待付款';
          break;
        case 'unShip':
          order.status = '待发货';
          break;
        case 'unSign':
          order.status = '待收货';
          break;
        case 'finish':
          order.status = '完成';
          break;
      }
      order.status += refund;
    }
    return order;
  });
};

shopOrdersSchema.statics.findById = async (orderId) => {
  const order = await mongoose.model('shopOrders').findOne({ orderId });
  if (!order) {
    throwErr(404, `未找到ID为【${orderId}】的订单`);
  }
  return order;
};

/**
 * 确认收货 银行将买家支付的kcb打给卖家
 * @author pengxiguaa 2019/3/27
 */
shopOrdersSchema.methods.confirmReceipt = async function () {
  const UserModel = mongoose.model('users');
  const SettingModel = mongoose.model('settings');
  const KcbsRecordModel = mongoose.model('kcbsRecords');
  const ShopOrdersModel = mongoose.model('shopOrders');
  const MessageModel = mongoose.model('messages');
  const {
    orderId,
    orderStatus,
    closeStatus,
    orderFreightPrice,
    orderPrice,
    refundStatus,
  } = this;
  let order = await ShopOrdersModel.findById(orderId);
  const orders = await ShopOrdersModel.userExtendOrdersInfo([order]);
  order = orders[0];
  if (closeStatus) {
    throwErr(400, `订单已被关闭，请刷新`);
  }
  if (orderStatus !== 'unSign') {
    throwErr(400, '订单未处于待收货状态，请刷新');
  }
  switch (refundStatus) {
    case 'ing':
      throwErr(400, '订单正处于退款流程，请刷新');
      break;
    case 'success':
      throwErr(400, '订单已被关闭，请刷新');
      break;
  }
  const time = Date.now();
  const mainScore = await SettingModel.getMainScore();
  const record = KcbsRecordModel({
    _id: await SettingModel.operateSystemID('kcbsRecords', 1),
    from: 'bank',
    scoreType: mainScore.type,
    to: order.sellUid,
    description: ``,
    type: 'sell',
    num: orderPrice + orderFreightPrice,
    toc: time,
    ordersId: [orderId],
  });
  await record.save();
  await ShopOrdersModel.updateOne(
    { orderId },
    {
      $set: {
        orderStatus: 'finish',
        finishToc: time,
      },
    },
  );
  await SettingModel.updateOne(
    { _id: 'kcb' },
    {
      $inc: {
        'c.totalMoney': -1 * (orderPrice + orderFreightPrice),
      },
    },
  );
  await UserModel.updateOne(
    { uid: order.sellUid },
    {
      $inc: {
        kcb: orderPrice + orderFreightPrice,
      },
    },
  );
  await MessageModel.sendShopMessage({
    type: 'shopBuyerConfirmReceipt',
    r: order.sellUid,
    orderId: order.orderId,
  });
};
/**
 * 拓展订单的凭证
 * @param {string} type buyer:只拓展买家上传的凭证，seller: 只拓展卖家上传的凭证，null: 都拓展
 * @return [Object] 凭证对象数组
 * @author pengxiguaa 2019/3/28
 */
shopOrdersSchema.methods.extendCerts = async function (type) {
  const ShopCertModel = mongoose.model('shopCerts');
  const { orderId, sellUid, buyUid } = this;
  const c = await ShopCertModel.find({ orderId, deleted: false }).sort({
    toc: 1,
  });
  const certs = [];
  for (const cert of c) {
    if (type === 'buyer') {
      if (cert.uid === buyUid) {
        certs.push(cert);
      }
    } else if (type === 'seller') {
      if (cert.uid === sellUid) {
        certs.push(cert);
      }
    } else {
      certs.push(cert);
    }
  }
  return (this.certs = certs);
};
/**
 * 买家取消订单
 * @author pengxiguaa 2019/4/2
 */
shopOrdersSchema.methods.cancelOrder = async function (reason) {
  const { contentLength } = require('../tools/checkString');
  if (reason && contentLength(reason) > 1000) {
    throwErr(400, '理由不能超过1000字节');
  }
  const ShopRefundModel = mongoose.model('shopRefunds');
  const SettingModel = mongoose.model('settings');
  const ShopOrdersModel = mongoose.model('shopOrders');
  const ShopCostRecordModel = mongoose.model('shopCostRecord');
  const ShopProductsParamsModel = mongoose.model('shopProductsParams');
  const ShopGoodsModel = mongoose.model('shopGoods');
  const shopCostRecord = await ShopCostRecordModel.findOne({
    orderId: this.orderId,
  });
  const productParam = await ShopProductsParamsModel.findOne({
    _id: shopCostRecord.productParamId,
  });
  const product = await ShopGoodsModel.findOne({
    productId: productParam.productId,
  });
  let refuCount = shopCostRecord.count;
  const time = Date.now();
  const refund = ShopRefundModel({
    _id: await SettingModel.operateSystemID('shopRefunds', 1),
    toc: time,
    status: 'B_GIVE_UP_ORDER',
    buyerId: this.buyUid,
    sellerId: this.sellUid,
    orderId: this.orderId,
    logs: [
      {
        status: 'B_GIVE_UP_ORDER',
        info: reason,
        time,
      },
    ],
  });
  await refund.save();
  await ShopOrdersModel.updateOne(
    { orderId: this.orderId },
    {
      $set: {
        closeToc: time,
        closeStatus: true,
        refundStatus: 'success',
      },
    },
  );
  // 恢复库存(拍下减库存)
  if (product.stockCostMethod === 'orderReduceStock') {
    await productParam.updateOne({
      $set: { stocksSurplus: productParam.stocksSurplus + refuCount },
    });
  }
};

/*
 * 卖家取消订单
 * 若卖家未付款，则填写理由直接取消即可
 * 若卖家已付款，则需卖家填写补偿金额并且输入密码填写理由
 * @param {Number} money 卖家支付给卖家的补偿款
 * @param {String} reason 取消的理由
 * @author pengixguaa 2019/4/3
 * */
shopOrdersSchema.methods.sellerCancelOrder = async function (reason, money) {
  const { contentLength } = require('../tools/checkString');
  if (reason && contentLength(reason) > 1000) {
    throwErr(400, '理由不能超过1000字节');
  }
  const ShopRefundModel = mongoose.model('shopRefunds');
  const SettingModel = mongoose.model('settings');
  const ShopOrdersModel = mongoose.model('shopOrders');
  const MessageModel = mongoose.model('messages');
  const UserModel = mongoose.model('users');
  const KcbsRecordModel = mongoose.model('kcbsRecords');
  const mainScore = await SettingModel.getMainScore();
  const { sellUid } = this;
  const orders = await ShopOrdersModel.userExtendOrdersInfo([this]);
  const order = orders[0];
  const time = Date.now();
  if (!['unCost', 'unShip'].includes(order.orderStatus)) {
    throwErr(400, '卖家仅能取消待付款或待发货的订单');
  }
  if (order.orderStatus === 'unShip') {
    if (money >= 100 && money <= 5000) {
    } else {
      throwErr(
        400,
        `补偿金额不能小于1${mainScore.name}且不能大于50${mainScore.name}`,
      );
    }
  }
  const refund = ShopRefundModel({
    _id: await SettingModel.operateSystemID('shopRefunds', 1),
    toc: time,
    status: 'S_GIVE_UP_ORDER',
    buyerId: this.buyUid,
    sellerId: sellUid,
    orderId: this.orderId,
    logs: [
      {
        status: 'S_GIVE_UP_ORDER',
        info: reason,
        money,
        time,
      },
    ],
  });
  await refund.save();
  let description = '';
  for (const p of order.params) {
    description += `${p.count}x${p.product.name}(${p.productParam.name}) `;
  }
  if (order.orderStatus === 'unCost') {
    await ShopOrdersModel.updateOne(
      { orderId: this.orderId },
      {
        $set: {
          closeToc: time,
          closeStatus: true,
          refundStatus: 'success',
        },
      },
    );
  }
  if (order.orderStatus === 'unShip') {
    const refundRecord = KcbsRecordModel({
      _id: await SettingModel.operateSystemID('kcbsRecords', 1),
      from: 'bank',
      scoreType: mainScore.type,
      to: order.buyUid,
      type: 'refund',
      num: order.orderPrice,
      description,
      ordersId: [order.orderId],
    });
    const record = KcbsRecordModel({
      _id: await SettingModel.operateSystemID('kcbsRecords', 1),
      from: sellUid,
      to: order.buyUid,
      scoreType: mainScore.type,
      description,
      type: 'sellerCancelOrder',
      num: money,
      ordersId: [order.orderId],
    });
    await ShopOrdersModel.updateOne(
      { orderId: this.orderId },
      {
        $set: {
          closeToc: time,
          closeStatus: true,
          refundStatus: 'success',
        },
      },
    );
    await refundRecord.save();
    await record.save();
    await UserModel.updateUserKcb(record.from);
    await UserModel.updateUserKcb(record.to);
  }
  await MessageModel.sendShopMessage({
    type: 'shopSellerCancelOrder',
    r: order.buyUid,
    orderId: order.orderId,
  });
};
/*
 * 获取订单上指定ID的商品
 * 判断商品是否已经退款完成
 * @param {Number} 订单上的规格ID（实际为购物车ID）
 * @author pengxiguaa 2019-4-17
 * */
shopOrdersSchema.methods.getParamById = async function (id) {
  const { orderId } = this;
  const ShopCostRecordModel = mongoose.model('shopCostRecord');
  const params = await ShopCostRecordModel.find({ orderId });
  let param;
  let succeedCount = 0;
  for (const p of params) {
    if (p.refundStatus === 'success') {
      succeedCount++;
    }
    if (p.costId === id) {
      param = p;
    }
  }
  if (!param) {
    throwErr(404, `订单${this.orderId}上未找到规格id为${id}的商品`);
  }
  if (param.refundStatus === 'success') {
    throwErr(400, `订单${this.orderId}上规格id为${id}的商品已退款完成`);
  }
  if (succeedCount === params.length - 1) {
    throwErr(400, '订单中仅剩一种商品，无法进行单一商品退款。');
  }
  return (await ShopCostRecordModel.orderExtendRecord([param]))[0];
};

/*
 * 创建有关购买商品的账单
 * @parma {[String]} ordersId 订单号组成的数组
 * @param {Number} totalMoney 支付的金额（分），用于验证支付的金额和订单总金额是否相等
 * @Parma {String} uid 购买者
 * */
shopOrdersSchema.statics.createRecordByOrdersId = async (props) => {
  const { ordersId, totalMoney, uid } = props;
  const ShopOrdersModel = mongoose.model('shopOrders');
  const KcbsRecordModel = mongoose.model('kcbsRecords');
  const MessageModel = mongoose.model('messages');
  const SettingModel = mongoose.model('settings');
  const UserModel = mongoose.model('users');
  const ShopProductsParamModel = mongoose.model('shopProductsParams');
  if (ordersId.length === 0) {
    throwErr(500, `ordersId 不能为空`);
  }
  const mainScore = await SettingModel.getMainScore();
  let orders = [];
  for (const orderId of ordersId) {
    const order = await ShopOrdersModel.findOne({ orderId });
    if (!order) {
      throwErr(400, `未找到ID为【${orderId}】的订单`);
    }
    if (order.buyUid !== uid) {
      throwErr(403, `订单【${orderId}】错误`);
    }
    if (order.closeStatus) {
      throwErr(400, '订单已关闭');
    }
    if (order.orderStatus !== 'unCost') {
      throwErr(400, `订单【${orderId}】暂不需要付款，请勿重复提交`);
    }
    orders.push(order);
  }
  const ordersInfo = await ShopOrdersModel.getOrdersInfo(orders);
  if (totalMoney !== ordersInfo.totalMoney) {
    throwErr(400, `需支付的金额与订单金额不一致，请刷新后再试`);
  }
  orders = await ShopOrdersModel.userExtendOrdersInfo(orders);
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const kcbsRecordId = await SettingModel.operateSystemID('kcbsRecords', 1);
    const record = KcbsRecordModel({
      _id: kcbsRecordId,
      from: uid,
      to: 'bank',
      scoreType: mainScore.type,
      type: 'pay',
      ordersId: [order.orderId],
      num: order.orderPrice + order.orderFreightPrice,
      description: ordersInfo.description[i],
      verify: true,
    });
    await record.save();
    // 更改订单状态为已付款，添加付款时间。
    await ShopOrdersModel.updateOne(
      { orderId: order.orderId },
      {
        $set: {
          orderStatus: 'unShip',
          payToc: record.toc,
        },
      },
    );
    // 给卖家发送付款成功消息
    await MessageModel.sendShopMessage({
      type: 'shopBuyerPay',
      r: order.sellUid,
      orderId: order.orderId,
    });
  }
  // 库存相关
  await ShopProductsParamModel.productParamReduceStock(
    orders,
    'payReduceStock',
  );
  await UserModel.updateUserScore(uid, mainScore.type);
};

/*
 * 验证订单号是否有效
 * @param {[String]} ordersId 订单 ID 组成的数组
 * @param {String} uid 用户 ID
 * @param {Number} money 金额
 * */
shopOrdersSchema.statics.verifyUserOrdersId = async (ordersId, uid, money) => {
  const ShopOrdersModel = mongoose.model('shopOrders');
  const orders = await ShopOrdersModel.find({ orderId: { $in: ordersId } });
  const { totalMoney } = await ShopOrdersModel.getOrdersInfo(orders);
  if (totalMoney !== money) {
    throwErr(400, `需支付的金额与订单金额不一致，请刷新后再试`);
  }
};

/*
 * 更新商城相关数据状态
 * */
shopOrdersSchema.statics.updateShopStatus = async () => {
  const time = Date.now();
  const SettingModel = mongoose.model('settings');
  const ShopOrdersModel = mongoose.model('shopOrders');
  const ShopRefundModel = mongoose.model('shopRefunds');
  const ShopGoodsModel = mongoose.model('shopGoods');
  const shopSettings = await SettingModel.getSettings('shop');
  let refunds;
  let orders;
  // 1. 自动确认收货
  orders = await ShopOrdersModel.find({
    closeStatus: false,
    refundStatus: { $in: [null, 'fail'] },
    orderStatus: 'unSign',
    autoReceiveTime: {
      $lte: time,
    },
  });
  for (const order of orders) {
    try {
      await order.confirmReceipt();
    } catch (err) {
      await order.updateOne({
        error: err.message || JSON.stringify(err),
      });
    }
  }

  // 2. 买家提出退货/退款退货申请
  refunds = await ShopRefundModel.find({
    status: {
      $in: ['B_APPLY_RM', 'B_APPLY_RP'],
    },
    succeed: null,
    tlm: {
      $lt: time - shopSettings.refund.agree * 60 * 60 * 1000,
    },
  });

  for (const refund of refunds) {
    try {
      await refund.sellerAgreeRM(
        `卖家处理超时，默认同意${
          refund.status === 'B_APPLY_RM' ? '退款' : '退货退款'
        }申请`,
      );
    } catch (err) {
      await refund.updateOne({
        error: err.message || JSON.stringify(err),
      });
    }
  }

  // 3. 买家退货，卖家确认收货超时
  refunds = await ShopRefundModel.find({
    status: 'B_INPUT_INFO',
    succeed: null,
    tlm: {
      $lt: time - shopSettings.refund.sellerReceive * 60 * 60 * 1000,
    },
  });
  for (const refund of refunds) {
    try {
      await refund.sellerAgreeRM('卖家处理超时，默认卖家确认收货');
    } catch (err) {
      await refund.updateOne({
        error: err.message || JSON.stringify(err),
      });
    }
  }

  // 4. 买家申请平台介入
  refunds = await ShopRefundModel.find({
    status: 'B_INPUT_CERT_RM',
    succeed: null,
    tlm: {
      $lt: time - shopSettings.refund.cert * 60 * 60 * 1000,
    },
  });
  for (const refund of refunds) {
    try {
      await refund.sellerAgreeRM('卖家处理超时，默认卖家同意退款');
    } catch (err) {
      await refund.updateOne({
        error: err.message || JSON.stringify(err),
      });
    }
  }

  // 5. 买家填写物流信息
  refunds = await ShopRefundModel.find({
    status: 'S_AGREE_RP',
    succeed: null,
    tlm: {
      $lt: time - shopSettings.refund.buyerTrack * 60 * 60 * 1000,
    },
  });
  for (const refund of refunds) {
    try {
      await refund.buyerGiveUp('买家发货超时，默认取消申请');
    } catch (err) {
      await refund.updateOne({
        error: err.message || JSON.stringify(err),
      });
    }
  }

  // 6. 买家下单 未付款
  orders = await ShopOrdersModel.find({
    closeStatus: false,
    refundStatus: { $in: [null, 'fail'] },
    orderStatus: 'unCost',
    orderToc: {
      $lt: time - shopSettings.refund.pay * 60 * 60 * 1000,
    },
  });
  for (const order of orders) {
    try {
      await order.cancelOrder('买家未在规定的时间内完成付款，订单已被取消');
    } catch (err) {
      order.updateOne({
        error: err.message || JSON.stringify(err),
      });
    }
  }

  // 7. 定时上架
  const products = await ShopGoodsModel.find({
    productStatus: 'notonshelf',
    $and: [
      {
        shelfTime: {
          $ne: null,
        },
      },
      {
        shelfTime: {
          $lt: Date.now(),
        },
      },
    ],
  });
  for (const product of products) {
    try {
      await product.onshelf();
    } catch (err) {
      await product.updateOne({
        error: err.message || JSON.stringify(err),
      });
    }
  }
};

shopOrdersSchema.statics.checkModifyAddressInfoPermission = async (orderId) => {
  const ShopOrdersModel = mongoose.model('shopOrders');
  const order = await ShopOrdersModel.findOnly(
    { orderId },
    {
      orderStatus: 1,
      closeStatus: 1,
    },
  );
  if (order.closeStatus) {
    throwErr(403, '订单已关闭，无法修改收货信息');
  }
  if (![orderStatus.unCost, orderStatus.unShip].includes(order.orderStatus)) {
    throwErr(403, '卖家已发货，不允许修改收货信息');
  }
};

shopOrdersSchema.statics.completeTrackNumber = async (props) => {
  let { trackNumber, trackName, receiveMobile } = props;
  if (receiveMobile) {
    const isSF = trackNumber.indexOf('SF') === 0;
    const endString = `:${receiveMobile.substring(
      receiveMobile.length - 4,
      receiveMobile.length,
    )}`;
    if (!trackNumber.includes(endString)) {
      if (
        trackName === 'SFEXPRESS' ||
        (trackName === 'AUTO' && isSF) ||
        trackName === 'ZTO'
      ) {
        trackNumber = trackNumber + endString;
      }
    }
  }
  return trackNumber;
};

const ShopOrdersModel = mongoose.model('shopOrders', shopOrdersSchema);

module.exports = ShopOrdersModel;
