const Router = require('koa-router');
const router = new Router();
const rollback = require('./rollback');
const { getJsonStringText } = require('../../../nkcModules/json');
const { OnlyOperation } = require('../../../middlewares/permission');
const { Operations } = require('../../../settings/operations');
router
  .get('/', OnlyOperation(Operations.visitPostHistory), async (ctx, next) => {
    const { pid } = ctx.params;
    const { db, data, query } = ctx;
    const { t, c } = query;
    const { nkcRender } = ctx.nkcModules;
    const targetPost = await db.PostModel.findOnly({ pid });
    // 验证权限
    const targetThread = await db.ThreadModel.findOnly({ tid: targetPost.tid });
    await targetThread.extendForums(['mainForums', 'minorForums']);
    await targetThread.ensurePermission(
      data.userRoles,
      data.userGrade,
      data.user,
    );
    if (
      targetPost.hideHistories &&
      !data.userOperationsId.includes('displayPostHideHistories')
    ) {
      ctx.throw(403, '权限不足');
    }

    data.post = targetPost;
    data.histories = [];
    let histories = await db.HistoriesModel.find({ pid }).sort({ tlm: 1 });
    histories.push(targetPost);
    const extendOptions = {
      visitor: data.user,
      userGrade: false,
      usersVote: false,
      credit: false,
      quote: false,
      uid: data.user ? data.user.uid : '',
    };
    if (!t) {
      extendOptions.renderHTML = false;
    }
    const ipToken = [];
    const uidlm = [];
    histories.map((h) => {
      ipToken.push(h.iplm);
      ipToken.push(h.ipoc);
      if (!targetPost.anonymous) {
        uidlm.push(h.uidlm);
      }
    });
    const ipsObj = await db.IPModel.getIPByTokens(ipToken);
    histories = await db.PostModel.extendPosts(histories, extendOptions);
    for (let i = 0; i < histories.length; i++) {
      const history = histories[i];
      if (!t) {
        history.c =
          history.l === 'json'
            ? getJsonStringText(history.c)
            : nkcRender.htmlToPlain(history.c);
      }
      history.ipoc = ipsObj[history.ipoc];
      history.iplm = ipsObj[history.iplm];
      history.version = i + 1;
      data.histories.push(history);
    }
    data.histories.reverse();
    data.t = t;
    if (!c) {
      data.c = data.histories[0]._id.toString();
    } else {
      data.c = c;
    }
    const users = await db.UserModel.find({ uid: { $in: uidlm } });
    const usersObj = {};
    users.map((u) => (usersObj[u.uid] = u));
    for (const h of data.histories) {
      if (h._id.toString() === data.c.toString()) {
        data.notes = await db.NoteModel.getNotesByPost(h);
      }
      h.targetUser = usersObj[h.uidlm];
    }
    ctx.template = 'post/history.pug';
    await next();
  })
  .put('/', OnlyOperation(Operations.disableHistories), async (ctx, next) => {
    const { body, db, params, data } = ctx;
    // if(data.userLevel < 6) ctx.throw(403, '权限不足');
    const { pid } = params;
    const { operation } = body;
    const targetPost = await db.PostModel.findOnly({ pid });
    if (operation === 'disableHistories') {
      await targetPost.updateOne({ hideHistories: true });
    } else if (operation === 'unDisableHistories') {
      await targetPost.updateOne({ hideHistories: false });
    }
    await next();
  })
  .use('/:_id', OnlyOperation(Operations.rollbackPost), async (ctx, next) => {
    const { pid, _id } = ctx.params;
    const { db, data } = ctx;
    const { PostModel, HistoriesModel, ThreadModel } = db;
    const originPost = await PostModel.findOnly({ pid });
    let targetPost = await HistoriesModel.findOnly({ _id });
    const targetThread = await ThreadModel.findOnly({ tid: originPost.tid });
    await targetThread.extendForums(['mainForums', 'minorForums']);
    await targetThread.ensurePermission(
      data.userRoles,
      data.userGrade,
      data.user,
    );
    data.originPost = originPost;
    data.targetPost = targetPost;
    await next();
  })
  .use('/:hid/rollback', rollback.routes(), rollback.allowedMethods());

module.exports = router;
