const router = require('koa-router')();
const { Public, OnlyUnbannedUser } = require('../../middlewares/permission');
router
  .get('/', Public(), async (ctx, next) => {
    const { query, db, data, nkcModules, state } = ctx;
    const { t: token } = query;
    const { getUrl } = nkcModules.tools;
    const tokenData = await db.OAuthTokenModel.getTokenByTokenString(token);
    await tokenData.verifyTokenBeforeAuthorize();
    const app = await db.OAuthAppModel.getAppById(tokenData.appId);
    data.oauthInfo = {
      appId: app._id,
      appIcon: getUrl('OAuthAppIcon', app.icon),
      appName: app.name,
      appHome: app.home,
      operations: [
        {
          type: tokenData.operation,
          name: state.lang('oauth', tokenData.operation),
        },
      ],
      token,
    };
    ctx.remoteTemplate = 'oauth/authentication/authentication.pug';
    await next();
  })
  .post('/', Public(), async (ctx, next) => {
    const { data, db, body } = ctx;
    const types = {
      getToken: 'getToken',
      getContent: 'getContent',
      checkService: 'checkService',
      getAccountInfo: 'getAccountInfo',
    };
    const { type, appId, secret } = body;
    const ip = ctx.address;
    const app = await db.OAuthAppModel.getAppBySecret({ appId, secret, ip });

    switch (type) {
      case types.getToken: {
        const { callback, operation } = body;
        await app.ensurePermission(operation);
        data.token = await db.OAuthTokenModel.createToken(
          appId,
          operation,
          callback,
        );
        break;
      }
      case types.getContent: {
        const { token } = body;
        const tokenData = await db.OAuthTokenModel.getTokenByTokenString(token);
        if (app._id !== tokenData.appId) {
          ctx.throw(403, '权限不足');
        }
        await tokenData.verifyTokenAfterAuthorize();
        await tokenData.useToken();
        data.operation = tokenData.operation;
        data.content = await tokenData.getContent();
        break;
      }
      case types.checkService: {
        data.status = 'OK';
        break;
      }
      case types.getAccountInfo: {
        const { uid } = body;
        await app.userAuth(uid);
        data.accountInfo = await db.OAuthAppModel.getUserAccountInfo(uid);
        break;
      }
      default: {
        ctx.throw(403, '未知的操作类型');
      }
    }
    await next();
  })
  .put('/', OnlyUnbannedUser(), async (ctx, next) => {
    const { body, state, db, data } = ctx;
    const { token, approved } = body;
    if (!state.uid) {
      ctx.throw(403, `请先登录`);
    }
    const tokenData = await db.OAuthTokenModel.getTokenByTokenString(token);
    await tokenData.verifyTokenBeforeAuthorize();
    if (approved) {
      await tokenData.authorizeToken(state.uid);
    } else {
      await tokenData.useToken();
    }
    data.url = `${tokenData.callback}?o=${tokenData.operation}&t=${token}`;
    await next();
  });
module.exports = router;
