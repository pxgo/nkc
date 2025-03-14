const Router = require('koa-router');
const appRouter = new Router();
const { appStores } = require('../../../../settings/app');
const { OnlyOperation } = require('../../../../middlewares/permission');
const { Operations } = require('../../../../settings/operations');
appRouter
  .get(
    '/',
    OnlyOperation(Operations.experimentalAppSettings),
    async (ctx, next) => {
      const { nkcModules, data, db, query } = ctx;
      const { page = 0, t = 'android' } = query;
      data.t = t;
      const count = await db.AppVersionModel.countDocuments({ appPlatForm: t });
      const paging = nkcModules.apiFunction.paging(page, count);
      data.paging = paging;
      data.histories = await db.AppVersionModel.find({ appPlatForm: t })
        .sort({ toc: -1 })
        .skip(paging.start)
        .limit(paging.perpage);
      data.appStores = { ...appStores };
      ctx.template = 'experimental/settings/app.pug';
      await next();
    },
  )
  .put(
    '/',
    OnlyOperation(Operations.experimentalAppSettings),
    async (ctx, next) => {
      const { db, body, nkcModules } = ctx;
      const { checkString } = nkcModules.checkData;
      const { operation, hash, stable, disabled, version, description } = body;
      const log = await db.AppVersionModel.findOne({ hash });
      if (!log) {
        ctx.throw(400, '未找到相关数据，请刷新页面后重试');
      }
      if (operation === 'modifyDisabled') {
        await log.updateOne({
          disabled: !!disabled,
        });
      } else if (operation === 'modifyStable') {
        if (stable) {
          await db.AppVersionModel.updateMany(
            { appPlatform: log.platForm },
            { $set: { stable: false } },
          );
        }
        await log.updateOne({
          stable: !!stable,
        });
      } else {
        checkString(version, {
          name: '版本号',
          minLength: 1,
          maxLength: 50,
        });
        checkString(description, {
          name: '更新说明',
          minLength: 1,
          maxLength: 2000,
        });
        const sameVersion = await db.AppVersionModel.findOne({
          appPlatform: log.platForm,
          appVersion: version,
          hash: { $ne: hash },
        });
        if (sameVersion) {
          ctx.throw(400, '版本号已存在，请检查安装包和输入的版本号是否相同');
        }
        const bodyAppStores = (body.appStores || []).filter(
          (item) => !!appStores[item],
        );
        await log.updateOne({
          appVersion: version,
          appDescription: description,
          appStores: bodyAppStores,
        });
      }
      await next();
    },
  )
  .post(
    '/',
    OnlyOperation(Operations.experimentalAppSettings),
    async (ctx, next) => {
      const { db, body, nkcModules, fs, fsPromise, settings } = ctx;
      const { checkString } = nkcModules.checkData;
      const { file } = body.files;
      const { name, size, path, hash } = file;
      const { appPlatform, appVersion, appDescription } = body.fields;
      const bodyAppStores = (body.fields.appStores || '')
        .split(',')
        .filter((item) => !!appStores[item]);
      if (!['android', 'ios'].includes(appPlatform)) {
        ctx.throw(400, '请选择平台');
      }
      checkString(appVersion, {
        name: '版本号',
        minLength: 1,
        maxLength: 50,
      });
      checkString(appDescription, {
        name: '更新说明',
        minLength: 1,
        maxLength: 2000,
      });
      const sameHash = await db.AppVersionModel.findOne({ hash });
      if (sameHash) {
        ctx.throw(400, '安装包已存在');
      }
      const sameVersion = await db.AppVersionModel.findOne({
        appVersion,
        appPlatform,
      });
      if (sameVersion) {
        ctx.throw(400, '版本号已存在');
      }
      let targetPath;
      if (appPlatform === 'android') {
        targetPath = settings.upload.androidSavePath + '/' + hash + '.apk';
      } else {
        targetPath = settings.upload.iosSavePath + '/' + hash + '.ipa';
      }
      await fsPromise.copyFile(path, targetPath);
      const v = db.AppVersionModel({
        appSize: size,
        fileName: name,
        hash,
        appPlatform,
        appVersion,
        appDescription,
        appStores: bodyAppStores,
      });
      await v.save();
      await next();
    },
  );
module.exports = appRouter;
