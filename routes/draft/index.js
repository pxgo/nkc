const router = require('koa-router')();
const { OnlyUser, OnlyUnbannedUser } = require('../../middlewares/permission');
const nkcRender = require('../../nkcModules/nkcRender');
const { renderHTMLByJSON } = require('../../nkcModules/nkcRender/json');
const allowedDesTypes = [
  'newThread',
  'modifyThread',
  'newPost',
  'modifyPost',
  'newComment',
  'modifyComment',
];
router
  .use('/', OnlyUser(), async (ctx, next) => {
    const { source } = ctx.query;
    // 局限于草稿的desType类型
    if (!allowedDesTypes.includes(source)) ctx.throw(400, 'source参数不正确');
    await next();
  })
  .get('/history', OnlyUser(), async (ctx, next) => {
    //获取文档历史版本
    ctx.template = 'draft/history/document.pug';
    const { db, data, state, query, permission, nkcModules } = ctx;
    const { draftId, desTypeId, source, page = 0 } = query;
    data.type = source;
    const { betaHistory, stableHistory } = await db.DraftModel.getType();
    const queryCriteria = {
      desTypeId,
      desType: source,
      type: { $in: [betaHistory, stableHistory] },
      uid: state.uid,
    };
    const { newThread, newPost } = await db.DraftModel.getDesType();
    if (source === newThread) {
      queryCriteria.did = desTypeId;
      delete queryCriteria.desTypeId;
    }
    // 后期完善：draftId应该先查一下
    if (
      draftId &&
      [
        'modifyThread',
        'modifyPost',
        'newPost',
        'newComment',
        'modifyComment',
      ].includes(source)
    ) {
      queryCriteria.did = draftId;
    }
    //  获取列表
    // 返回分页信息
    const count = await db.DraftModel.countDocuments(queryCriteria);
    const paging = nkcModules.apiFunction.paging(page, count, 10);
    data.paging = paging;
    data.history = await db.DraftModel.find(queryCriteria)
      .sort({ tlm: -1 })
      .skip(paging.start)
      .limit(paging.perpage);
    if (data.history.length) {
      // 默认返回第一项内容
      data.document = data.history[0];
      const { threadCategoriesWarning, threadCategories } =
        await db.DraftModel.extendThreadCategories(data.document.tcId);
      data.document.threadCategoriesWarning = threadCategoriesWarning;
      data.document.threadCategories = threadCategories;
      if (data.document.uid !== state.uid) {
        if (!permission('viewUserArticle')) ctx.throw(403, '没有权限');
      }
      // const documentResourceId = await data.document.getResourceReferenceId();
      if (data.document.l === 'json') {
        const resources = await db.ResourceModel.getResourcesByJson(
          data.document.c,
        );
        data.document.content = renderHTMLByJSON({
          json: data.document.c,
          resources,
          xsf: data.user.xsf,
        });
      } else {
        const resources = await db.ResourceModel.getResourcesByTags(
          data.document.c,
        );
        data.document.content = nkcRender.renderHTML({
          type: 'article',
          post: {
            c: data.document.c,
            resources,
          },
        });
      }
      // 包含了将此版本改为编辑版的url 组成
      data.urlComponent = {
        _id: data.document._id,
        did: data.document.did,
        source,
        page,
        desTypeId,
        draftId,
      };
      // 查询文章作者
      const user = await db.UserModel.findOnly({ uid: data.document.uid });
      const avatarUrl = nkcModules.tools.getUrl('userAvatar', user.avatar);
      data.user = { ...user.toObject(), avatarUrl };
    } else {
      data.document = '';
      // data.bookId = ''
      data.urlComponent = '';
    }
    if (data.document.originState !== 0) {
      const originDesc = nkcModules.apiFunction.getOriginLevel(
        data.document.originState,
      );
      data.document.originDesc = originDesc;
    }
    await next();
  })
  .get('/history/:_id', OnlyUser(), async (ctx, next) => {
    ctx.template = 'draft/history/document.pug';
    const { db, data, params, state, query, permission, nkcModules } = ctx;
    const { desTypeId, source, page = 0, draftId } = query;
    // _id 被选中文章
    const { _id } = params;
    // if (!allowedDesTypes.includes(source)) ctx.throw(400, "source参数不正确")
    data.type = source;
    const { betaHistory, stableHistory } = await db.DraftModel.getType();
    const { newThread } = await db.DraftModel.getDesType();

    // 查询其他历史
    const queryCriteria = {
      desTypeId,
      desType: source,
      type: { $in: [betaHistory, stableHistory] },
      uid: state.uid,
    };
    // 如果时新文章只能通过did查找历史
    if (source === newThread) {
      queryCriteria.did = desTypeId;
      delete queryCriteria.desTypeId;
    }
    if (
      draftId &&
      [
        'modifyThread',
        'modifyPost',
        'newPost',
        'newComment',
        'modifyComment',
      ].includes(source)
    ) {
      queryCriteria.did = draftId;
    }
    const count = await db.DraftModel.countDocuments(queryCriteria);
    const paging = nkcModules.apiFunction.paging(page, count, 10);
    data.paging = paging;
    data.history = await db.DraftModel.find(queryCriteria)
      .sort({ tlm: -1 })
      .skip(paging.start)
      .limit(paging.perpage);
    function find(data, id) {
      let res;
      for (const obj of data) {
        if (obj._id.toString() === id) {
          res = obj;
          break;
        }
      }
      if (!res) ctx.throw(400, '不存在id为' + _id + '的文章');
      return res;
    }
    // 在 历史记录中找到当前需要显示内容的文章
    data.document = find(data.history, _id);
    if (!data.document) {
      // 如果添加了很多历史记录，而没有刷新，直接点击历史就可能出现在当前页找不到指定的数据，因为数据发生了改变（主要是可能排在了其他页中）
      data.document = data.history[0];
    }
    const { threadCategoriesWarning, threadCategories } =
      await db.DraftModel.extendThreadCategories(data.document.tcId);
    data.document.threadCategoriesWarning = threadCategoriesWarning;
    data.document.threadCategories = threadCategories;
    if (data.document.uid !== state.uid) {
      if (!permission('viewUserArticle')) ctx.throw(403, '没有权限');
    }
    data.paging = paging;
    data.document.user = await db.UserModel.findOnly({
      uid: data.document.uid,
    });
    // const documentResourceId = await data.document.getResourceReferenceId();
    // let resources = await db.ResourceModel.getResourcesByReference(documentResourceId);

    if (data.document.l === 'json') {
      const resources = await db.ResourceModel.getResourcesByJson(
        data.document.c,
      );
      data.document.content = renderHTMLByJSON({
        json: data.document.c,
        resources,
        xsf: data.user.xsf,
      });
    } else {
      const resources = await db.ResourceModel.getResourcesByTags(
        data.document.c,
      );
      data.document.content = nkcRender.renderHTML({
        type: 'article',
        post: {
          c: data.document.c,
          resources,
        },
      });
    }
    // data.document.content = nkcRender.renderHTML({
    //   type: 'article',
    //   post: {
    //     c: data.document.c,
    //     resources
    //   },
    // });
    // let editorUrl = {_id: data.document._id}
    data.urlComponent = {
      _id: data.document._id,
      source,
      did: data.document.did,
      page,
      desTypeId,
      draftId,
    };
    // 查询文章作者
    const user = await db.UserModel.findOnly({ uid: data.document.uid });
    const avatarUrl = nkcModules.tools.getUrl('userAvatar', user.avatar);
    data.user = { ...user.toObject(), avatarUrl };
    if (data.document.originState !== 0) {
      data.document.originDesc = nkcModules.apiFunction.getOriginLevel(
        data.document.originState,
      );
    }
    await next();
  })
  .post('/history/:_id/edit', OnlyUnbannedUser(), async (ctx, next) => {
    const { db, params, query, state } = ctx;
    //  正在编辑的改为历史版
    const { desTypeId, source } = query;
    // if (!allowedDesTypes.includes(source)) ctx.throw(400, "source参数不正确")
    // 当前历史记录改为编辑版，并且复制了一份为历史版
    const { _id } = params;
    const DraftModel = db.DraftModel;
    const betaDraft = await DraftModel.getBeta(desTypeId, source, state.uid);
    if (betaDraft) {
      await DraftModel.updateToBeta(_id, source, state.uid);
      await DraftModel.createToBetaHistory(_id, source, state.uid);
      // 正在编辑改为历史
      await betaDraft.updateToBetaHistory();
    }
    // 如果betaDraft不存在那么用户可能已经把编辑版本进行了发布，或者恶意行为
    // if(!betaDraft) ctx.throw(400, "草稿未找到")
    await next();
  });
module.exports = router;
