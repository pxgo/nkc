const Router = require('koa-router');
const editorRouter = require('./editor');
const {
  columnNameCheckerService,
} = require('../../services/column/columnNameChecker.service');
const {
  columnAbbrCheckerService,
} = require('../../services/column/columnAbbrChecker.service');
const { OnlyUser, OnlyUnbannedUser } = require('../../middlewares/permission');
const router = new Router();
router
  .get('/', OnlyUser(), async (ctx, next) => {
    const { data, db } = ctx;
    const { user } = data;
    const column = await db.ColumnModel.findOne({ uid: user.uid });
    if (column && !column.closed) {
      let url = `/m/${column._id}`;
      return ctx.redirect(url);
    }
    const columnSettings = await db.SettingModel.getSettings('column');
    const grades = await db.UsersGradeModel.find(
      {},
      { displayName: 1, _id: 1 },
    ).sort({ _id: 1 });
    let hasGrade = false;
    let userGrades = [];
    for (const ug of grades) {
      if (ug._id === user.grade._id) {
        hasGrade = true;
      }
      if (!columnSettings.userGrade.includes(ug._id)) {
        continue;
      }
      userGrades.push(ug.displayName);
    }
    data.conditions = {
      xsfCount: [
        '学术分',
        columnSettings.xsfCount,
        user.xsf,
        columnSettings.xsfCount <= user.xsf,
      ],
      digestCount: [
        '精选数',
        columnSettings.digestCount,
        user.digestThreadsCount,
        columnSettings.digestCount <= user.digestThreadsCount,
      ],
      threadCount: [
        '文章数',
        columnSettings.threadCount,
        user.threadCount - user.disabledThreadsCount,
        columnSettings.threadCount <=
          user.threadCount - user.disabledThreadsCount,
      ],
      userGrade: ['用户等级', userGrades, user.grade.displayName, hasGrade],
    };
    ctx.template = 'column/column.pug';
    await next();
  })
  .get('/getColumn', OnlyUser(), async (ctx, next) => {
    const { db, data, state } = ctx;
    const columnPermission = await db.UserModel.ensureApplyColumnPermission(
      data.user,
    );
    const userColumn = await db.UserModel.getUserColumn(state.uid);
    data.column = {
      userColumn: userColumn,
      columnPermission: columnPermission,
      addedToColumn: state.addedToColumn,
    };
    await next();
  })
  .get('/getColumn', OnlyUser(), async (ctx, next) => {
    const { db, data, query } = ctx;
    const { columnId, columnName, articleId } = query;
    const targetColumns = [];
    if (columnName) {
      const column = await db.ColumnModel.findOne({
        nameLowerCase: columnName.toLowerCase(),
        closed: false,
      });
      if (column) {
        let inColumn = null;
        let inContribute = false;
        let inColumnUrl = '';
        // 检查是否具有添加专栏文章分类的权限
        const userPermissionObject =
          await db.ColumnModel.getUsersPermissionKeyObject();
        const categoryPermission =
          column.uid === data.user.uid ||
          (await db.ColumnModel.checkUsersPermission(
            column.users,
            data.user.uid,
            userPermissionObject.column_settings_category,
          ));
        if (articleId) {
          // 文章是否在搜索专栏中
          const columnPost = await db.ColumnPostModel.findOne({
            columnId: column._id,
            pid: articleId,
          });
          if (columnPost) {
            inColumn = true;
            inColumnUrl = `/m/${columnPost.columnId}/a/${columnPost._id}`;
          }

          // 是否有投稿申请
          const contribute = await db.ColumnContributeModel.findOne({
            tid: articleId,
            source: 'article',
            columnId: column._id,
          }).sort({ toc: -1 });
          if (contribute && contribute.passed === 'pending') {
            inContribute = true;
          }
        }
        targetColumns.push({
          _id: column._id,
          avatar: column.avatar,
          name: column.name,
          abbr: column.abbr,
          inColumn,
          inContribute,
          categoryPermission,
          inColumnUrl,
        });
      }
    }
    if (columnId) {
      if (isNaN(Number(columnId))) {
        return ctx.throw(400, '专栏ID格式有误');
      }
      const column = await db.ColumnModel.findOne({
        _id: columnId,
        closed: false,
      });
      if (column) {
        let inColumn = null;
        let inContribute = false;
        let inColumnUrl = '';
        // 检查是否具有添加专栏文章分类的权限
        const userPermissionObject =
          await db.ColumnModel.getUsersPermissionKeyObject();
        const categoryPermission =
          column.uid === data.user.uid ||
          (await db.ColumnModel.checkUsersPermission(
            column.users,
            data.user.uid,
            userPermissionObject.column_settings_category,
          ));
        if (articleId) {
          // 文章是否在搜索专栏中
          const columnPost = await db.ColumnPostModel.findOne({
            columnId: column._id,
            pid: articleId,
          });
          if (columnPost) {
            inColumn = true;
            inColumnUrl = `/m/${columnPost.columnId}/a/${columnPost._id}`;
          }

          // 是否有投稿申请
          const contribute = await db.ColumnContributeModel.findOne({
            tid: articleId,
            source: 'article',
            columnId: column._id,
          }).sort({ toc: -1 });
          if (contribute && contribute.passed === 'pending') {
            inContribute = true;
          }
        }
        targetColumns.push({
          _id: column._id,
          avatar: column.avatar,
          name: column.name,
          abbr: column.abbr,
          inColumn,
          inContribute,
          categoryPermission,
          inColumnUrl,
        });
      }
    }
    data.targetColumns = targetColumns;
    await next();
  })
  .post('/', OnlyUnbannedUser(), async (ctx, next) => {
    const { data, db, body, state } = ctx;
    const columnPermission = await db.UserModel.ensureApplyColumnPermission(
      data.user,
    );
    const userColumn = await db.UserModel.getUserColumn(state.uid);
    if (!columnPermission) {
      ctx.throw(403, '你的账号暂未满足开设专栏的条件');
    }
    if (userColumn) {
      ctx.throw(403, '你已开设专栏');
    }
    const { files, fields } = body;
    const { avatar, banner } = files;
    const { abbr, name, description } = fields;
    if (!avatar) {
      ctx.throw(400, '专栏Logo不能为空');
    }
    if (!banner) {
      ctx.throw(400, '专栏Banner不能为空');
    }
    await columnNameCheckerService.checkColumnName(name);
    await columnAbbrCheckerService.checkColumnAbbr(abbr);
    const column = db.ColumnModel({
      _id: await db.SettingModel.operateSystemID('columns', 1),
      uid: data.user.uid,
      userLogs: [
        {
          uid: data.user.uid,
          time: new Date(),
        },
      ],
      name,
      nameLowerCase: name.toLowerCase(),
      abbr,
      description,
    });
    const category = db.ColumnPostCategoryModel({
      _id: await db.SettingModel.operateSystemID('columnPostCategories', 1),
      columnId: column._id,
      default: true,
      name: '默认分类',
      description: '默认分类',
    });
    await column.save();
    await category.save();
    await db.AttachmentModel.saveColumnAvatar(column._id, avatar);
    await db.AttachmentModel.saveColumnBanner(column._id, banner);
    data.column = column;
    await db.ColumnModel.toSearch(column._id);
    await next();
  })
  .get('/apply', OnlyUser(), async (ctx, next) => {
    const { data, db, nkcModules } = ctx;
    const columnPermission = await db.UserModel.ensureApplyColumnPermission(
      data.user,
    );
    if (!columnPermission) {
      ctx.throw(403, '你的账号暂未满足开设专栏的条件');
    }
    ctx.template = 'column/apply.pug';
    const nkcRender = nkcModules.nkcRender;
    const createColumnInfo = (await db.SettingModel.getSettings('column'))
      .createColumnInfo;
    data.createColumnInfo = nkcRender.plainEscape(createColumnInfo);
    const { user } = data;
    const column = await db.ColumnModel.findOne({ uid: user.uid });
    if (column) {
      let url = `/m/${column._id}`;
      if (column.closed) {
        await column.updateOne({ closed: false });
      }
      return ctx.redirect(url);
    }
    await next();
  })
  .use('/editor', editorRouter.routes(), editorRouter.allowedMethods());
module.exports = router;
