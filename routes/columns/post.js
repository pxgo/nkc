const Router = require('koa-router');
const { OnlyUnbannedUser, OnlyUser } = require('../../middlewares/permission');
const router = new Router();
router
  .get('/', OnlyUser(), async (ctx, next) => {
    const { query, data, db, nkcModules } = ctx;
    const { page = 0, cid, mcid } = query;
    const { column, user, isModerator } = data;
    if (
      column.uid !== user.uid &&
      !ctx.permission('column_single_disabled') &&
      column.users.findIndex((item) => item.uid === user.uid) === -1
    )
      ctx.throw(403, '权限不足');
    const q = {
      columnId: column._id,
    };
    const sort = {};
    if (cid) {
      // q.cid = cid;
      // 分类下的子分类
      const childCategoryId =
        await db.ColumnPostCategoryModel.getChildCategoryId(cid);
      childCategoryId.push(cid);
      q.cid = { $in: childCategoryId };
      if (mcid) {
        sort[`order.cid_${cid}_${mcid}`] = -1;
      } else {
        sort[`order.cid_${cid}_default`] = -1;
      }
    } else {
      if (mcid) {
        sort[`order.cid_default_${mcid}`] = -1;
      } else {
        sort[`order.cid_default_default`] = -1;
      }
    }
    if (mcid) {
      q.mcid = mcid === 'other' ? [] : mcid;
    }
    const count = await db.ColumnPostModel.countDocuments(q);
    const paging = nkcModules.apiFunction.paging(page, count);
    const columnPosts = await db.ColumnPostModel.find(q)
      .sort(sort)
      .skip(paging.start)
      .limit(paging.perpage);
    data.columnPosts = await db.ColumnPostModel.extendColumnPosts({
      columnPosts,
      isModerator,
    });
    data.paging = paging;
    await next();
  })
  .post('/', OnlyUnbannedUser(), async (ctx, next) => {
    const { body, data, db } = ctx;
    const {
      postsId,
      type,
      categoryId,
      mainCategoriesId,
      minorCategoriesId,
      categoryType,
      operationType,
    } = body;
    const { column, user } = data;
    let childCategoryId = [];
    if (categoryId) {
      childCategoryId = await db.ColumnPostCategoryModel.getChildCategoryId(
        categoryId,
      );
      childCategoryId.push(categoryId);
    }
    if (
      column.uid !== user.uid &&
      column.users.findIndex((item) => item.uid === user.uid) === -1
    )
      ctx.throw(403, '权限不足');
    if (!postsId || postsId.length === 0) {
      if (!['sortByPostTimeDES', 'sortByPostTimeASC'].includes(type)) {
        ctx.throw(400, '最少包含一条内容');
      }
    }
    const userPermissionObject =
      await db.ColumnModel.getUsersPermissionKeyObject();
    switch (type) {
      case 'removeColumnPostById': {
        const isPermission = await db.ColumnModel.checkUsersPermission(
          column.users,
          user.uid,
          userPermissionObject.column_post_delete,
        );
        if (!isPermission && column.uid !== user.uid) {
          ctx.throw(403, '权限不足');
        }
        break;
      }
      case 'categoryToTop':
      case 'categoryToBottom':
      case 'categoryUp':
      case 'categoryDown':
      case 'sortByPostTimeDES':
      case 'sortByPostTimeASC': {
        const isPermission = await db.ColumnModel.checkUsersPermission(
          column.users,
          user.uid,
          userPermissionObject.column_post_order,
        );
        if (!isPermission && column.uid !== user.uid) {
          ctx.throw(403, '权限不足');
        }
        break;
      }
      case 'moveById': {
        const isPermission = await db.ColumnModel.checkUsersPermission(
          column.users,
          user.uid,
          userPermissionObject.column_settings_category,
        );
        if (!isPermission && column.uid !== user.uid) {
          ctx.throw(403, '权限不足');
        }
        break;
      }
      case 'columnTop':
      case 'unColumnTop':
      case 'categoryTop':
      case 'unCategoryTop': {
        const isPermission = await db.ColumnModel.checkUsersPermission(
          column.users,
          user.uid,
          userPermissionObject.column_post_order,
        );
        if (!isPermission && column.uid !== user.uid) {
          ctx.throw(403, '权限不足');
        }
        break;
      }
    }
    if (type === 'addToColumn') {
      // 推送文章到专栏
      if (!mainCategoriesId || mainCategoriesId.length === 0)
        ctx.throw(400, '文章分类不能为空');
      for (const _id of mainCategoriesId.concat(minorCategoriesId)) {
        const c = await db.ColumnPostCategoryModel.findOne({
          _id,
          columnId: column._id,
        });
        if (!c) ctx.throw(400, `ID为${_id}的分类不存在`);
      }
      for (const pid of postsId) {
        let columnPost = await db.ColumnPostModel.findOne({
          columnId: column._id,
          pid,
        });
        // const order = await db.ColumnPostModel.getCategoriesOrder(mainCategoriesId);
        if (columnPost) {
          await columnPost.updateOne({
            cid: mainCategoriesId,
            mcid: minorCategoriesId,
            order: await db.ColumnPostModel.getColumnPostOrder(
              mainCategoriesId,
              minorCategoriesId,
            ),
          });
          continue;
        }
        // const post = await db.PostModel.findOne({pid, uid: column.uid});
        // if(!post || post.uid !== user.uid) continue;

        await db.ColumnPostModel.addColumnPosts(
          column,
          mainCategoriesId,
          minorCategoriesId,
          [pid],
        );

        /*const thread = await db.ThreadModel.findOne({tid: post.tid});
        columnPost = db.ColumnPostModel({
          _id: await db.SettingModel.operateSystemID("columnPosts", 1),
          tid: thread.tid,
          top: post.toc,
          order,
          pid,
          type: thread.oc === pid? "thread": "post",
          columnId: column._id,
          cid: mainCategoriesId,
          mcid: minorCategoriesId,
        });
        await columnPost.save();*/
      }
    } else if (type === 'removeColumnPostById') {
      // 通过ID删除专栏内容
      for (const _id of postsId) {
        const columnPost = await db.ColumnPostModel.findOne({
          _id,
          columnId: column._id,
        });
        if (columnPost) {
          await columnPost.deleteOne();
          if (columnPost.type === 'article') {
            // 撤稿时清除文章sid中专栏ID片段
            let sidArray = [];
            // let sid = '';
            const columnPostArray = await db.ColumnPostModel.find({
              pid: columnPost.pid,
              type: 'article',
            });
            for (const columnPostItem of columnPostArray) {
              sidArray.push(columnPostItem.columnId);
            }
            sidArray = [...new Set(sidArray)];
            const article = await db.ArticleModel.findOne({
              _id: columnPost.pid,
            });
            await article.updateOne({ $set: { sid: sidArray.join('-') } });
          }
        }
        await db.ColumnModel.updateOne(
          { _id: column._id },
          { $pull: { topped: _id } },
        );
      }
      await db.ColumnPostCategoryModel.removeToppedThreads(column._id);
    } else if (type === 'removeColumnPostByPid') {
      // 通过pid删除专栏内容
      for (const pid of postsId) {
        const post = await db.ColumnPostModel.findOne({
          columnId: column._id,
          pid,
        });
        if (post) {
          await post.deleteOne();
          await db.ColumnModel.updateOne(
            { _id: column._id },
            { $pull: { topped: post._id } },
          );
        }
      }
      await db.ColumnPostCategoryModel.removeToppedThreads(column._id);
    } else if (type === 'moveById') {
      // 更改专栏内容分类
      const setObj = {};
      // categoryType: 修改文章的分类类型，all: 主分类 + 辅分类，main: 仅主分类，minor: 仅辅分类
      // operationType: 操作类型，replace: 替换原有分类，add: 添加分类
      if (['all', 'main'].includes(categoryType)) {
        if (operationType === 'replace' && mainCategoriesId.length === 0)
          ctx.throw(400, '文章主分类不能为空');
        await db.ColumnPostCategoryModel.checkCategoriesId(mainCategoriesId);
        setObj.cid = mainCategoriesId;
      }
      if (['all', 'minor'].includes(categoryType)) {
        await db.ColumnPostCategoryModel.checkCategoriesId(minorCategoriesId);
        setObj.mcid = minorCategoriesId;
      }
      for (const _id of postsId) {
        const columnPost = await db.ColumnPostModel.findOne({
          columnId: column._id,
          _id,
        });
        if (!columnPost) continue;
        if (['all', 'main'].includes(categoryType)) {
          const { order } = columnPost;
          const newOrder = { ...JSON.parse(JSON.stringify(order)) };
          const cIds = ['default', ...setObj.cid];
          const mcIds = ['default', 'other', ...setObj.mcid];
          for (const cid of cIds) {
            for (const mcid of mcIds) {
              if (order[`cid_${cid}_${mcid}`] === undefined) {
                newOrder[`cid_${cid}_${mcid}`] =
                  await db.SettingModel.operateSystemID('columnPostOrders', 1);
              }
            }
          }
          // for(const cid of setObj.cid) {
          //   let o = order[`cid_${cid}`];
          //   if(o === undefined) o = await db.SettingModel.operateSystemID("columnPostOrders", 1);
          //   newOrder[`cid_${cid}`] = o
          // }
          setObj.order = newOrder;
        }
        // 仅仅是增加分类
        if (operationType === 'add') {
          if (setObj.cid)
            setObj.cid = [...new Set(setObj.cid.concat(columnPost.cid))];
          if (setObj.mcid)
            setObj.mcid = [...new Set(setObj.mcid.concat(columnPost.mcid))];
          if (setObj.order) Object.assign(setObj.order, columnPost.order);
        }
        await db.ColumnPostModel.updateOne(
          {
            columnId: column._id,
            _id,
          },
          {
            $set: setObj,
          },
        );
      }
      await db.ColumnPostCategoryModel.removeToppedThreads(column._id);
    } else if (type === 'columnTop') {
      // 专栏置顶
      for (const _id of postsId) {
        const p = await db.ColumnPostModel.findOne({
          columnId: column._id,
          _id,
        });
        if (!p) continue;
        if (!column.topped.includes(_id)) column.topped.unshift(_id);
      }

      await column.updateOne({
        topped: column.topped,
      });

      data.columnTopped = column.topped;
    } else if (type === 'unColumnTop') {
      // 取消专栏置顶
      const arr = [];
      for (const _id of postsId) {
        const p = await db.ColumnPostModel.findOne({
          columnId: column._id,
          _id,
        });
        if (!p) continue;
        arr.push(_id);
      }
      column.topped = column.topped.filter((_id) => !arr.includes(_id));

      await column.updateOne({
        topped: column.topped,
      });

      data.columnTopped = column.topped;
    } else if (
      [
        'categoryToTop', // 移动到顶部
        'categoryToBottom', // 移动到底部
      ].includes(type)
    ) {
      let keyName = ``;
      if (!categoryId) {
        if (minorCategoriesId) {
          keyName = `order.cid_default_${minorCategoriesId}`;
        } else {
          keyName = `order.cid_default_default`;
        }
        // keyName = "order.cid_default";
      } else {
        const category = await db.ColumnPostCategoryModel.findOne({
          columnId: column._id,
          _id: categoryId,
        });
        if (!category) ctx.throw(400, `文章分类ID错误 ID: ${categoryId}`);
        // keyName = `order.cid_${categoryId}`;
        if (minorCategoriesId) {
          keyName = `order.cid_${categoryId}_${minorCategoriesId}`;
        } else {
          keyName = `order.cid_${categoryId}_default`;
        }
      }
      await db.ColumnPostModel.checkColumnPostOrder(
        column._id,
        categoryId,
        minorCategoriesId,
      );
      const arr = [];
      for (const _id of postsId) {
        const p = await db.ColumnPostModel.findOne({
          columnId: column._id,
          _id,
        });
        if (!p) continue;
        arr.push(p);
      }
      if (type === 'categoryToTop') {
        for (const p of arr) {
          const updateObj = {};
          updateObj[keyName] = await db.SettingModel.operateSystemID(
            'columnPostOrders',
            1,
          );
          await p.updateOne(updateObj);
        }
      } else if (type === 'categoryToBottom') {
        for (const p of arr) {
          const updateObj = {};
          updateObj[keyName] = await db.SettingModel.operateSystemID(
            'columnPostDownOrders',
            -1,
          );
          await p.updateOne(updateObj);
        }
      }
    } else if (['categoryUp', 'categoryDown'].includes(type)) {
      // 上移、下移
      let keyName = '',
        orderKeyName = '';
      if (categoryId) {
        const category = await db.ColumnPostCategoryModel.findOne({
          columnId: column._id,
          _id: categoryId,
        });
        if (!category) ctx.throw(400, `文章分类ID错误 ID: ${categoryId}`);
        // keyName = `order.cid_${categoryId}`;
        // orderKeyName = `cid_${categoryId}`;
        if (minorCategoriesId) {
          keyName = `order.cid_${categoryId}_${minorCategoriesId}`;
          orderKeyName = `cid_${categoryId}_${minorCategoriesId}`;
        } else {
          keyName = `order.cid_${categoryId}_default`;
          orderKeyName = `cid_${categoryId}_default`;
        }
      } else {
        if (minorCategoriesId) {
          keyName = `order.cid_default_${minorCategoriesId}`;
          orderKeyName = `cid_default_${minorCategoriesId}`;
        } else {
          keyName = `order.cid_default_default`;
          orderKeyName = `cid_default_default`;
        }
        // keyName = "order.cid_default";
        // orderKeyName = `cid_default`
      }
      // 检查当前页面数据中order是否正确
      await db.ColumnPostModel.checkColumnPostOrder(
        column._id,
        categoryId,
        minorCategoriesId,
      );
      let columnPost = await db.ColumnPostModel.findOne({
        columnId: column._id,
        _id: postsId,
      });
      if (!columnPost) ctx.throw(400, `找不到ID为${postsId}的专栏文章记录`);
      const match = {
        columnId: column._id,
      };
      if (minorCategoriesId) {
        match.mcid = minorCategoriesId === 'other' ? [] : minorCategoriesId;
      }
      const sort = {};
      if (type === 'categoryUp') {
        match[keyName] = { $gt: columnPost.order[orderKeyName] || 0 };
        sort[keyName] = 1;
      } else {
        match[keyName] = { $lt: columnPost.order[orderKeyName] || 0 };
        sort[keyName] = -1;
      }
      const columnPost_ = await db.ColumnPostModel.findOne(match).sort(sort);
      if (columnPost_) {
        const newOrder = columnPost_.order[orderKeyName];
        const oldOrder = columnPost.order[orderKeyName] || 0;

        let updateObj = {};
        updateObj[keyName] = newOrder;
        await columnPost.updateOne(updateObj);
        updateObj = {};
        updateObj[keyName] = oldOrder;
        await columnPost_.updateOne(updateObj);
      }
    } else if (['categoryTop', 'unCategoryTop'].includes(type)) {
      // 专栏置顶、取消专栏置顶
      const category = await db.ColumnPostCategoryModel.findOne({
        columnId: column._id,
        _id: categoryId,
      });
      if (!category) ctx.throw(400, `文章分类ID错误 ID: ${categoryId}`);
      // 查询条件不应该有cid:categoryId,很多子孙级categoryId并没有放在cid中
      const columnPost = await db.ColumnPostModel.findOne({
        columnId: column._id,
        _id: postsId,
      });
      if (!columnPost) ctx.throw(400, `找不到ID为${postsId}的专栏文章记录`);
      if (type === 'categoryTop') {
        await category.updateOne({
          $addToSet: {
            topped: columnPost._id,
          },
        });
      } else {
        await category.updateOne({
          $pull: {
            topped: columnPost._id,
          },
        });
      }
      data.categoryTopped = (
        await db.ColumnPostCategoryModel.findOne({ _id: categoryId })
      ).topped;
    } else if (['sortByPostTimeDES', 'sortByPostTimeASC'].includes(type)) {
      let keyName = '';
      const match = {
        columnId: column._id,
      };
      if (!categoryId) {
        if (minorCategoriesId) {
          keyName = `order.cid_default_${minorCategoriesId}`;
          match.mcid = minorCategoriesId === 'other' ? [] : minorCategoriesId;
        } else {
          keyName = `order.cid_default_default`;
        }
      } else {
        const category = await db.ColumnPostCategoryModel.findOne({
          columnId: column._id,
          _id: categoryId,
        });
        if (!category) ctx.throw(400, `文章分类ID错误 ID: ${categoryId}`);
        if (minorCategoriesId) {
          keyName = `order.cid_${categoryId}_${minorCategoriesId}`;
          match.mcid = minorCategoriesId === 'other' ? [] : minorCategoriesId;
        } else {
          keyName = `order.cid_${categoryId}_default`;
        }

        // match.cid = categoryId;
        match.cid = { $in: childCategoryId };
      }
      const sort = {
        toc: -1,
      };
      if (type === 'sortByPostTimeDES') {
        sort.toc = 1;
      }

      const columnPosts = await db.ColumnPostModel.find(match);
      const pid = columnPosts.map((post) => post.pid);
      const posts = await db.PostModel.find({ pid: { $in: pid } }).sort(sort);
      for (const post of posts) {
        const obj = {};
        obj[keyName] = await db.SettingModel.operateSystemID(
          'columnPostOrders',
          1,
        );
        await db.ColumnPostModel.updateOne(
          {
            columnId: column._id,
            pid: post.pid,
          },
          {
            $set: obj,
          },
        );
      }
    }
    await next();
  });

module.exports = router;
