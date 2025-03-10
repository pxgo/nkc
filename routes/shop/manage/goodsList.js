const Router = require('koa-router');
const goodslistRouter = new Router();
const {
  OnlyUnbannedUser,
  OnlyUser,
} = require('../../../middlewares/permission');
goodslistRouter
  .use('/', OnlyUser(), async (ctx, next) => {
    const { data } = ctx;
    data.active = 'goodslist';
    await next();
  })
  .get('/', OnlyUser(), async (ctx, next) => {
    const { data, db, params, query, nkcModules } = ctx;
    const { page = 0 } = query;
    let { productStatus } = query;
    data.productStatus = productStatus;
    const { user } = data;
    // 构造查询条件
    let searchMap = {
      uid: user.uid,
    };
    if (!productStatus || productStatus == 'insale') {
      searchMap.productStatus = 'insale';
    } else if (productStatus == 'stopsale') {
      searchMap.productStatus = 'stopsale';
    } else {
      searchMap.productStatus = 'notonshelf';
    }
    const count = await db.ShopGoodsModel.countDocuments(searchMap);
    const paging = nkcModules.apiFunction.paging(page, count);
    data.paging = paging;
    const products = await db.ShopGoodsModel.find(searchMap)
      .sort({ toc: -1 })
      .skip(paging.start)
      .limit(paging.perpage);
    data.products = await db.ShopGoodsModel.extendProductsInfo(products);
    data.productStatus = productStatus;
    ctx.template = 'shop/manage/goodslist.pug';
    await next();
  })
  // 访问规格重新编辑页面
  .get('/editParam', OnlyUser(), async (ctx, next) => {
    const { data, query, db, nkcModules } = ctx;
    const { paraId } = query;
    if (!paraId) {
      ctx.throw(400, '商品规格有误');
    }
    // 获取对应规格商品
    let productParams = await db.ShopProductsParamModel.find({ _id: paraId });
    productParams = await db.ShopProductsParamModel.extendParamsInfo(
      productParams,
    );
    data.productParam = productParams[0];
    ctx.template = 'shop/manage/goodsParamEdit.pug';
    await next();
  })
  // 提交规格修改信息
  .put('/editParam', OnlyUnbannedUser(), async (ctx, next) => {
    const { data, db, nkcModules, body } = ctx;
    const { user } = data;
    let {
      paramId,
      productId,
      originPrice,
      price,
      stocksSurplus,
      useDiscount,
      name,
      isEnable,
    } = body.paramData;
    const productParam = await db.ShopProductsParamModel.findOne({
      _id: paramId,
      uid: user.uid,
      productId,
    });
    if (!productParam) {
      ctx.throw(400, '找不到该商品规格');
    }
    const { checkString, checkNumber } = nkcModules.checkData;
    checkString(name, {
      name: '规格名称',
      minLength: 1,
      maxLength: 100,
    });
    checkNumber(stocksSurplus, {
      name: '规格库存',
      min: 0,
    }),
      checkNumber(originPrice, {
        name: '价格',
        min: 0.01,
        fractionDigits: 2,
      });
    originPrice = originPrice * 100;
    useDiscount = !!useDiscount;
    isEnable = !!isEnable;
    if (useDiscount) {
      if (price >= originPrice) {
        throw '规格优惠价必须小于原价';
      }
      checkNumber(price, {
        name: '优惠价',
        min: 0.01,
        fractionDigits: 2,
      });
      price = price * 100;
    } else {
      price = originPrice;
    }
    await productParam.updateOne({
      name,
      stocksSurplus,
      originPrice,
      isEnable,
      useDiscount,
      price,
    });
    await next();
  })
  // 访问商品重新编辑页面
  .get('/editProduct', OnlyUser(), async (ctx, next) => {
    const { data, body, query, params, db } = ctx;
    const { productId } = query;
    if (!productId) {
      ctx.throw(400, '商品Id有误');
    }
    let product = await db.ShopGoodsModel.findOne({ productId });
    if (!product) {
      ctx.throw(400, '商品不存在');
    }
    product = await db.ShopGoodsModel.extendProductsInfo([product]);
    const dealInfo = await db.ShopDealInfoModel.findOne({ uid: data.user.uid });
    data.dealInfo = dealInfo;
    data.product = product[0];
    ctx.template = 'shop/manage/goodsProductEdit.pug';
    await next();
  })
  // 提交商品修改信息
  .put('/editProduct', OnlyUnbannedUser(), async (ctx, next) => {
    const { data, body, query, db } = ctx;
    const { user } = data;
    const {
      stockCostMethod,
      purchaseLimitCount,
      uploadCert,
      uploadCertDescription,
      isFreePost,
      freightPrice,
      productId,
      freightTemplates,
      params,
      productParams,
      singleParams,
      vipDiscount,
      vipDisGroup,
      productSettings,
      imgIntroductions,
      imgMaster,
    } = body;
    const product = await db.ShopGoodsModel.findOne({ productId });
    if (user.uid !== product.uid) {
      ctx.throw(400, '您无权修改别人的作品');
    }
    // 删除旧的销售规格
    let oldParaIdArr = [];
    if (product.paraIdArr) {
      oldParaIdArr = product.paraIdArr;
    }
    await db.ShopProductsParamModel.deleteMany({ _id: { $in: oldParaIdArr } });
    // 删除旧的独立规格
    let oldSingleParaIdArr = [];
    if (product.singleParaIdArr) {
      oldSingleParaIdArr = product.singleParaIdArr;
    }
    await db.ShopProductsParamModel.deleteMany({
      _id: { $in: oldSingleParaIdArr },
    });
    // 添加新的销售规格
    let paraIdArr = [];
    for (const p of productParams) {
      if (p.originPrice < 0) {
        p.originPrice = 0;
      }
      p.productId = productId;
      p.uid = user.uid;
      if (!p.useDiscount) {
        p.price = p.originPrice;
      }
      p.stocksSurplus = p.stocksTotal;
      p._id = await db.SettingModel.operateSystemID('shopProductsParams', 1);
      paraIdArr.push(p._id);
      const d = db.ShopProductsParamModel(p);
      await d.save();
    }
    // 添加新的独立规格
    let singleParaIdArr = [];
    for (const s of singleParams) {
      if (s.originPrice < 0) {
        s.originPrice = 0;
      }
      s.productId = productId;
      if (!s.useDiscount) {
        s.price = s.originPrice;
      }
      s.uid = user.uid;
      s.type = 'single';
      s.stocksSurplus = s.stocksTotal;
      s._id = await db.SettingModel.operateSystemID('shopProductsParams', 1);
      singleParaIdArr.push(s._id);
      const sd = db.ShopProductsParamModel(s);
      await sd.save();
    }
    // 修改产品属性列表
    await product.updateOne({
      $set: {
        stockCostMethod,
        purchaseLimitCount,
        uploadCert,
        uploadCertDescription,
        isFreePost,
        freightPrice,
        params,
        paraIdArr,
        singleParaIdArr,
        vipDiscount,
        vipDisGroup,
        productSettings,
        imgIntroductions,
        imgMaster,
        freightTemplates,
      },
    });
    await next();
  })
  // 立即上架
  .put('/shelfRightNow', OnlyUnbannedUser(), async (ctx, next) => {
    const { data, body, params, db } = ctx;
    const { productId } = body;
    const product = await db.ShopGoodsModel.findOne({ productId });
    await product.onshelf();
    await next();
  })
  // 商品停售
  .put('/productStopSale', OnlyUnbannedUser(), async (ctx, next) => {
    const { data, body, db } = ctx;
    const { productId } = body;
    const product = await db.ShopGoodsModel.findOne({ productId });
    if (!product) {
      ctx.throw(400, '商品不存在');
    }
    if (product.productStatus === 'stopsale') {
      ctx.throw(400, '该商品已处于停售状态');
    }
    await product.updateOne({ $set: { productStatus: 'stopsale' } });
    await next();
  })
  // 商品复售
  .put('/productGoonSale', OnlyUnbannedUser(), async (ctx, next) => {
    const { data, body, db } = ctx;
    const { productId } = body;
    const product = await db.ShopGoodsModel.findOne({ productId });
    if (!product) {
      ctx.throw(400, '商品不存在');
    }
    if (product.productStatus === 'insale') {
      ctx.throw(400, '商品已处于售卖状态');
    }
    await product.updateOne({ $set: { productStatus: 'insale' } });
    await next();
  });
module.exports = goodslistRouter;
