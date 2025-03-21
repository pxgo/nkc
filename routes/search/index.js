const Router = require('koa-router');
const {
  getJsonStringTextSlice,
  getJsonStringText,
} = require('../../nkcModules/json');
const { momentVisibleType } = require('../../settings/moment');
const router = new Router();
const { Public } = require('../../middlewares/permission');
router.get('/', Public(), async (ctx, next) => {
  const time = Date.now();
  const { db, data, query, state, nkcModules } = ctx;

  const sources = await db.AccessControlModel.getSources();
  await db.AccessControlModel.checkAccessControlPermissionWithThrowError({
    isApp: state.isApp,
    uid: state.uid,
    rolesId: data.userRoles.map((role) => role._id),
    gradeId: state.uid ? data.userGrade._id : undefined,
    source: sources.search,
  });

  const { elasticSearch } = nkcModules;
  let { page = 0, t = '', c = '', d = '', form = '' } = query;
  const { user } = data;
  // 通过mongodb精准搜索用户名
  let targetUser,
    existUser = false,
    searchUserFromMongodb = false,
    uidToUser;
  if (c) {
    data.c = c;
    if (!d) {
      d = Buffer.from(encodeURIComponent(JSON.stringify({ a: 1 }))).toString(
        'base64',
      );
    }
  }
  c = c.trim();
  data.t = t;
  data.d = d;
  data.form = form;
  let options;

  const readableForumsId = await db.ForumModel.getReadableForumsIdByUid(
    user ? user.uid : null,
  );

  // 高级搜索参数
  if (d) {
    try {
      options = JSON.parse(
        decodeURIComponent(Buffer.from(d, 'base64').toString()),
      );
      if (options.fid && options.fid.length > 0) {
        options.fid = options.fid.filter((id) => readableForumsId.includes(id));
        data.selectedForums = await db.ForumModel.find(
          { fid: { $in: options.fid } },
          {
            fid: 1,
            displayName: 1,
            color: 1,
            avatar: 1,
          },
        ).sort({ order: 1 });
      }
      if (options.excludedFid && options.excludedFid.length > 0) {
        options.excludedFid = options.excludedFid.filter((id) =>
          readableForumsId.includes(id),
        );
        data.excludedForums = await db.ForumModel.find(
          { fid: { $in: options.excludedFid } },
          {
            fid: 1,
            displayName: 1,
            color: 1,
            avatar: 1,
          },
        ).sort({ order: 1 });
      }
      searchUserFromMongodb = !options.author;
    } catch (err) {
      console.log(err);
    }
  }

  if (options) {
    options.page = page;
  } else {
    options = {
      page: page,
    };
  }

  let results = [];
  data.results = [];

  const displayOnSearchForumsId =
    await db.ForumModel.getDisplayOnSearchForumsIdFromRedis();
  const fidOfCanGetThreads = readableForumsId.filter((id) =>
    displayOnSearchForumsId.includes(id),
  );
  /*const fidOfCanGetThreads = await db.ForumModel.getThreadForumsId(
      data.userRoles,
      data.userGrade,
      user
    );*/

  // 若用户没有选择筛选专业，则默认从用户能进的专业搜索
  // 若用户选择了筛选专业，则加载用户已选专业的所有子专业，并过滤掉用户不能访问的专业。
  if (options.fid && options.fid.length > 0) {
    let allFid = [];
    for (const id of options.fid) {
      allFid.push(id);
      allFid = allFid.concat(await db.ForumModel.getAllChildForumsIdByFid(id));
    }
    options.fid = allFid.filter((id) => fidOfCanGetThreads.includes(id));
  } else {
    options.fid = fidOfCanGetThreads;
  }

  if (t === 'document_article' || t === 'document_comment') {
    options.fid = [];
  }

  // 加载分页设置
  const {
    searchThreadList,
    searchAllList,
    searchPostList,
    searchUserList,
    searchColumnList,
    searchResourceList,
    searchDocumentList,
  } = (await db.SettingModel.findById('page')).c;

  // 用户输入了搜索的关键词，进入高级搜索。
  if (c) {
    // 搜索结果
    results = await nkcModules.elasticSearch.search(t, c, options);
    // 首先需要对关键词进行格式化处理，处理中间的空格,去重(一次性匹配的话可以不用),转义特殊字符
    let keyWordArray = c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    keyWordArray = keyWordArray
      .split(/\s+/)
      .filter((item, index, self) => self.indexOf(item) === index && item);
    const keyWordString = keyWordArray.join('|');
    // 总匹配数
    data.total = results.hits.total;
    results = results.hits.hits.map((r) => {
      const resource = r._source;
      if (r.highlight) {
        // 在内容中匹配到含有关键词的内容
        const highlightKeys = Object.keys(r.highlight);
        for (const key of highlightKeys) {
          const textContentArray = [];
          for (let textContent of r.highlight[key]) {
            textContent = elasticSearch.replaceSearchResultHTMLLink(
              textContent + '',
            );
            textContent = nkcModules.apiFunction.obtainPureText(textContent);
            textContent = textContent.replace(
              new RegExp(`${keyWordString}`, 'ig'),
              (match) => `<span style="color: #e85a71;">${match}</span>`,
            );
            textContentArray.push(textContent);
          }

          r.highlight[key] = textContentArray;
        }
      }

      resource.highlight = r.highlight;
      return resource;
    });
    // 根据分页设置，计算分页
    let perpage;
    if (t === 'user') {
      perpage = searchUserList;
      if (searchUserFromMongodb) {
        targetUser = await db.UserModel.findOne({
          usernameLowerCase: c.toLowerCase(),
        });
      }
    } else if (t === 'post') {
      perpage = searchPostList;
    } else if (t === 'thread') {
      perpage = searchThreadList;
    } else if (t === 'column') {
      perpage = searchColumnList;
    } else if (t === 'resource') {
      perpage = searchResourceList;
    } else if (
      t === 'document_article' ||
      t === 'document_comment' ||
      t === 'document_moment'
    ) {
      perpage = searchDocumentList;
    } else {
      perpage = searchAllList;
      if (searchUserFromMongodb) {
        targetUser = await db.UserModel.findOne({
          usernameLowerCase: c.toLowerCase(),
        });
        uidToUser = await db.UserModel.findOne({ uid: c });
      }
    }
    data.paging = nkcModules.apiFunction.paging(page, data.total, perpage);

    if (targetUser && Number(page) === 0) {
      data.total++;
      results.unshift({
        uid: targetUser.uid,
        docType: 'user',
        username: targetUser.username,
        highlight: {
          username: [
            `<span style="color: #e85a71;">${targetUser.username}</span>`,
          ],
        },
      });
    }
    if (uidToUser && Number(page) === 0) {
      data.total++;
      results.unshift({
        uid: uidToUser.uid,
        docType: 'user',
        username: uidToUser.username,
        highlight: {
          uid: [`<span style="color: #e85a71;">${uidToUser.uid}</span>`],
        },
      });
    }
  }

  // 如果搜索结果不为空
  if (results && results.length > 0) {
    const postObj = {},
      threadObj = {},
      userObj = {};
    const columnObj = {},
      columnPageObj = {};
    const pids = new Set();
    const tids = new Set();
    const uids = new Set();
    const columnId = new Set();
    const columnPageId = new Set();
    const resourceId = new Set();
    const libId = new Set();
    const articleDocumentId = new Set();
    const commentDocumentId = new Set();
    const momentDocumentId = new Set();
    let threadCategoriesId = [];
    const highlightObj = {};
    results.map((r) => {
      pids.add(r.pid);
      uids.add(r.uid);
      if (r.tcId && r.tcId.length > 0) {
        threadCategoriesId = threadCategoriesId.concat(r.tcId);
      }
      if (r.docType === 'column') {
        columnId.add(r.tid);
      } else if (r.docType === 'columnPage') {
        columnPageId.add(r.tid);
      } else if (r.docType === 'resource') {
        libId.add(r.tid);
      } else if (r.docType === 'attachment') {
        resourceId.add(r.tid);
      } else if (r.docType === 'document_article') {
        articleDocumentId.add(r.tid);
      } else if (r.docType === 'document_comment') {
        commentDocumentId.add(r.tid);
      } else if (r.docType === 'document_moment') {
        momentDocumentId.add(r.tid);
      }
      if (r.highlight) {
        if (
          r.docType === 'post' ||
          r.docType === 'thread' ||
          r.docType === 'document_article' ||
          r.docType === 'document_comment' ||
          r.docType === 'document_moment'
        ) {
          let _id = r.pid;
          if (
            r.docType === 'document_article' ||
            r.docType === 'document_comment' ||
            r.docType === 'document_moment'
          ) {
            _id = r.tid;
          }
          if (r.highlight.title) {
            highlightObj[_id + '_title'] = '' + r.highlight.title;
          }

          if (r.highlight.content) {
            highlightObj[_id + '_content'] = '内容：' + r.highlight.content;
          }
          if (r.highlight.keywordsEN) {
            highlightObj[_id + '_keywordsEN'] =
              '关键词：' + r.highlight.keywordsEN;
          }
          if (r.highlight.keywordsCN) {
            highlightObj[_id + '_keywordsCN'] =
              '关键词：' + r.highlight.keywordsCN;
          }
          if (r.highlight.abstractEN) {
            highlightObj[_id + '_abstractEN'] =
              'Abstract：' + r.highlight.abstractEN;
          }
          if (r.highlight.abstractCN) {
            highlightObj[_id + '_abstractCN'] =
              '摘要：' + r.highlight.abstractCN;
          }
          if (
            (r.docType === 'thread' || r.docType === 'post') &&
            r.highlight.pid
          ) {
            highlightObj[_id + '_pid'] = '文号：' + r.highlight.pid;
          }
          if (
            (r.docType === 'document_article' ||
              r.docType === 'document_comment' ||
              r.docType === 'document_moment') &&
            r.highlight.tid
          ) {
            highlightObj[_id + '_tid'] = '文号：' + r.highlight.tid;
          }
          if (r.highlight.aid) {
            highlightObj[_id + '_aid'] = '基金编号：' + r.highlight.aid;
          }
          if (r.highlight.authors) {
            highlightObj[_id + '_authors'] = '作者：' + r.highlight.authors;
          }
        } else if (r.docType === 'user') {
          if (r.highlight.username) {
            highlightObj[r.uid + '_username'] = r.highlight.username;
          }
          if (r.highlight.uid) {
            highlightObj[r.uid + '_uid'] = r.highlight.uid;
          }
          if (r.highlight.description) {
            highlightObj[r.uid + '_description'] = r.highlight.description;
          }
        } else if (r.docType === 'column') {
          if (r.highlight.username) {
            highlightObj[r.tid + '_name'] = r.highlight.username;
          }
          if (r.highlight.description) {
            highlightObj[r.tid + '_abbr'] = r.highlight.description;
          }
        } else if (r.docType === 'columnPage') {
          if (r.highlight.title) {
            highlightObj[r.tid + '_t'] = r.highlight.title;
          }
          if (r.highlight.content) {
            highlightObj[r.tid + '_c'] = r.highlight.content;
          }
        } else if (r.docType === 'resource') {
          if (r.highlight.title) {
            highlightObj[r.tid + '_t'] = r.highlight.title;
          }
          if (r.highlight.content) {
            highlightObj[r.tid + '_c'] = r.highlight.content;
          }
        } else if (r.docType === 'attachment') {
          if (r.highlight.title) {
            highlightObj[r.tid + '_t'] = r.highlight.title;
          }
          if (r.content) {
            highlightObj[r.tid + '_d'] = r.content;
          }
          if (r.highlight.content) {
            highlightObj[r.tid + '_c'] = r.highlight.content;
          }
        }
      }
    });
    const posts = await db.PostModel.find({
      pid: { $in: [...pids] },
      reviewed: true,
    });
    posts.map((post) => {
      tids.add(post.tid);
      post.c =
        post.l === 'json'
          ? getJsonStringTextSlice(post.c, 200)
          : nkcModules.apiFunction.obtainPureText(post.c, true, 200);
      postObj[post.pid] = post;
    });

    const users = await db.UserModel.find({ uid: { $in: [...uids] } });
    users.map((user) => {
      userObj[user.uid] = user;
    });

    let threads = await db.ThreadModel.find({
      tid: { $in: [...tids] },
      reviewed: true,
    });
    threads = await db.ThreadModel.extendThreads(threads, {
      forum: true,
      category: false,
      firstPost: true,
      firstPostUser: true,
      userInfo: false,
      lastPost: false,
      lastPostUser: false,
      firstPostResource: true,
      htmlToText: true,
      count: 200,
    });

    threads.map((thread) => {
      threadObj[thread.tid] = thread;
    });

    let columns = await db.ColumnModel.find({ _id: { $in: [...columnId] } });
    columns = await db.ColumnModel.extendColumns(columns);
    columns.map((column) => {
      columnObj[column._id] = column;
    });
    const columnPages = await db.ColumnPageModel.find({
      _id: { $in: [...columnPageId] },
    });
    const pageColumnId = new Set();
    columnPages.map((page) => {
      columnPageObj[page._id] = page;
      pageColumnId.add(page.columnId);
    });
    const pageColumns = await db.ColumnModel.find({
      _id: { $in: [...pageColumnId] },
    });
    const pageColumnObj = {};
    pageColumns.map((pc) => {
      pageColumnObj[pc._id] = pc;
    });
    const accessibleForumsId = await db.ForumModel.getAccessibleForumsId(
      data.userRoles,
      data.userGrade,
      user,
    );
    let libraries = await db.LibraryModel.find({
      _id: { $in: [...libId] },
    });
    const filteredLibraries = [];
    for (const item of libraries) {
      if (item.deleted || item.closed) {
        continue;
      } else if (item.uid !== state.uid) {
        const resourceItem = await db.ResourceModel.findOne({ rid: item.rid });
        if (!resourceItem) {
          continue;
        }
        const perm = await resourceItem.getPermission(accessibleForumsId);
        if (!perm) {
          continue;
        }
        filteredLibraries.push(item);
      } else {
        filteredLibraries.push(item);
      }
    }
    libraries = filteredLibraries;
    // const resources = await db.LibraryModel.find({
    //   _id: { $in: [...resourceId] },
    // });
    let resources = await db.ResourceModel.find({
      rid: { $in: [...resourceId] },
      type: 'resource',
    });
    // 需要判断用户是否有权限访问此附件(专业相关)。。。。
    const filteredResources = [];
    for (const item of resources) {
      if (item.disabled || item.del) {
        continue;
      } else if (item.uid !== state.uid) {
        if (item.references.length === 0) {
          continue;
        }
        const perm = await item.getPermission(accessibleForumsId);
        if (!perm) {
          continue;
        }
        filteredResources.push(item);
      } else {
        filteredResources.push(item);
      }
    }
    resources = filteredResources;
    const resourcesObj = {};
    const librariesObj = {};
    libraries.map((r) => {
      librariesObj[r._id] = r;
    });
    resources.map((r) => {
      resourcesObj[r.rid] = r;
    });
    const threadCategories = await db.ThreadCategoryModel.getCategoriesById([
      ...new Set(threadCategoriesId),
    ]);
    const threadCategoriesObj = {};
    for (let i = 0; i < threadCategories.length; i++) {
      const category = threadCategories[i];
      threadCategoriesObj[category.nodeId] = category;
    }

    const articlesObj = {};
    const commentObj = {};
    const { normal: normalStatus } = await db.ArticleModel.getArticleStatus();
    let articles = await db.ArticleModel.find({
      did: { $in: [...articleDocumentId] },
      status: normalStatus,
    });
    let comments = await db.CommentModel.find({
      did: { $in: [...commentDocumentId] },
      status: normalStatus,
    });
    let moments = await db.MomentModel.find({
      did: { $in: [...momentDocumentId] },
      status: normalStatus,
      visibleType: momentVisibleType.everyone,
    });

    articles = await db.ArticleModel.getArticlesInfo(articles);
    comments = await db.CommentModel.getCommentsInfo(comments);
    const momentObj = await db.MomentModel.extendMomentsData(
      moments,
      state.uid,
      'did',
    );
    for (const a of articles) {
      articlesObj[a.did] = a;
    }
    for (const c of comments) {
      commentObj[c.did] = c;
    }

    // 根据文档类型，拓展数据
    loop1: for (const result of results) {
      let r;
      const { docType, pid, uid, tid, tcId } = result;
      if (['thread', 'post'].includes(docType)) {
        const post = postObj[pid];
        if (!post || post.disabled) {
          continue;
        }
        const postUser = userObj[post.uid];
        if (!postUser) {
          continue;
        }
        const thread = threadObj[post.tid];
        if (!thread) {
          continue;
        }
        // 需要判断内容的权限（时间限制）
        try {
          await db.SettingModel.restrictAccess({
            toc: thread.toc,
            forums: thread.forums,
            isAuthor: state.uid && state.uid === thread.uid,
            userRolesId: data.userRoles.map((role) => role._id),
            userGradeId: data.userGrade._id,
          });
        } catch (error) {
          continue loop1;
        }
        for (const fid of thread.mainForumsId) {
          if (!fidOfCanGetThreads.includes(fid)) {
            continue loop1;
          }
        }

        let link;
        if (thread.oc === post.pid) {
          link = `/t/${thread.tid}`;
        } else {
          const m = { pid: post.pid };
          if (!ctx.permission('displayDisabledPosts')) {
            m.disabled = false;
          }
          link = await db.PostModel.getUrl(post);
        }

        const forums = thread.forums.map((forum) => {
          return {
            displayName: forum.displayName,
            fid: forum.fid,
          };
        });
        let tc = [];
        if (docType === 'thread') {
          for (const id of tcId) {
            const category = threadCategoriesObj[id];
            if (!category) {
              continue;
            }
            tc.push(category);
          }
        }

        r = {
          docType,
          link,
          pid: post.pid,
          oc: thread.oc,
          docNumber: highlightObj[`${pid}_pid`],
          title: highlightObj[`${pid}_title`] || post.t || thread.firstPost.t,
          threadCategories: tc,
          abstract:
            highlightObj[`${pid}_pid`] ||
            highlightObj[`${pid}_aid`] ||
            highlightObj[`${pid}_authors`] ||
            highlightObj[`${pid}_keywordsEN`] ||
            highlightObj[`${pid}_keywordsCN`] ||
            highlightObj[`${pid}_abstractEN`] ||
            highlightObj[`${pid}_abstractCN`] ||
            highlightObj[`${pid}_content`] ||
            post.abstract ||
            post.c,
          threadTime: thread.toc,
          postTime: post.toc,
          tid: thread.tid,
          anonymous: post.anonymous,
          forums,
        };
        r.title = elasticSearch.replaceSearchResultHTMLLink(r.title + '');
        r.abstract = elasticSearch.replaceSearchResultHTMLLink(r.abstract + '');
        if (!post.anonymous) {
          r.postUser = {
            uid: postUser.uid,
            avatar: postUser.avatar,
            username: postUser.username,
          };
        }
      } else if (docType === 'user') {
        if (targetUser && targetUser.uid === uid) {
          if (existUser) {
            continue;
          }
          existUser = true;
        }
        const u = userObj[uid];
        if (
          !u ||
          (u.certs.includes('banned') && !ctx.permission('bannedUser'))
        ) {
          continue;
        }
        await u.extendGrade();
        await db.UserModel.extendUsersInfo([u]);
        r = {
          docType,
          username: highlightObj[`${uid}_username`] || u.username,
          description: highlightObj[`${uid}_description`] || u.description,
          user: u,
          uid: highlightObj[`${uid}_uid`] || u.uid,
        };
        r.username = elasticSearch.replaceSearchResultHTMLLink(r.username + '');
        r.description = elasticSearch.replaceSearchResultHTMLLink(
          r.description + '',
        );
      } else if (docType === 'column') {
        const column = columnObj[tid];
        if (!column) {
          continue;
        }
        if (!ctx.permission('column_single_disabled')) {
          if (!column || column.disabled || column.closed) {
            continue;
          }
        }
        r = {
          docType,
          name: highlightObj[`${tid}_name`] || column.name,
          abbr: highlightObj[`${tid}_abbr`] || column.abbr,
          column,
        };
        r.name = elasticSearch.replaceSearchResultHTMLLink(r.name + '');
        r.abbr = elasticSearch.replaceSearchResultHTMLLink(r.abbr + '');
      } else if (docType === 'columnPage') {
        const page = columnPageObj[tid];
        if (!page) {
          continue;
        }
        const column = pageColumnObj[page.columnId];
        if (!column) {
          continue;
        }
        if (!ctx.permission('column_single_disabled')) {
          if (!column || column.disabled || column.closed) {
            continue;
          }
        }
        page.c =
          page.l === 'json'
            ? getJsonStringText(page.c)
            : nkcModules.apiFunction.obtainPureText(page.c, true, 200);
        r = {
          docType,
          t: highlightObj[`${tid}_t`] || page.t,
          c: highlightObj[`${tid}_c`] || page.c,
          column,
          page,
        };
        r.t = elasticSearch.replaceSearchResultHTMLLink(r.t + '');
        r.c = elasticSearch.replaceSearchResultHTMLLink(r.c + '');
      } else if (docType === 'resource') {
        let library = librariesObj[tid];
        if (!library) {
          continue;
        }
        library = library.toObject();
        library.user = userObj[library.uid];
        r = {
          docType,
          t: highlightObj[`${tid}_t`] || library.name,
          c: highlightObj[`${tid}_c`] || library.description,
          resource: library,
        };
        r.t = elasticSearch.replaceSearchResultHTMLLink(r.t + '');
        r.c = elasticSearch.replaceSearchResultHTMLLink(r.c + '');
      } else if (docType === 'attachment') {
        let resource = resourcesObj[tid];
        if (!resource) {
          continue;
        }
        resource = resource.toObject();
        resource.user = userObj[resource.uid];
        r = {
          docType,
          t: highlightObj[`${tid}_t`] || resource.oname,
          c: highlightObj[`${tid}_c`] || highlightObj[`${tid}_d`] || '',
          resource,
        };
        r.t = elasticSearch.replaceSearchResultHTMLLink(r.t + '');
        r.c = elasticSearch.replaceSearchResultHTMLLink(r.c + '');
      } else if (docType === 'document_article') {
        //article文章搜索
        const article = articlesObj[tid];
        if (!article) {
          continue;
        }
        const { document, user, column = '' } = article;
        const articleUser = userObj[user.uid];
        r = {
          source: article.source,
          docType,
          documentId: document._id,
          articleId: article._id,
          link: article.url,
          docNumber: highlightObj[`${tid}_tid`],
          title:
            highlightObj[`${tid}_title`] || document.title || article.title,
          abstract:
            highlightObj[`${tid}_tid`] ||
            highlightObj[`${tid}_pid`] ||
            highlightObj[`${tid}_aid`] ||
            highlightObj[`${tid}_authors`] ||
            highlightObj[`${tid}_keywordsEN`] ||
            highlightObj[`${tid}_keywordsCN`] ||
            highlightObj[`${tid}_abstractEN`] ||
            highlightObj[`${tid}_abstractCN`] ||
            highlightObj[`${tid}_content`] ||
            '内容：' +
              (document.l === 'json'
                ? getJsonStringTextSlice(document.content, 200)
                : nkcModules.apiFunction.obtainPureText(
                    document.content,
                    true,
                    200,
                  )),
          documentTime: document.toc,
          articleTime: article.toc,
          tid: document.did,
          anonymous: document.anonymous,
        };
        if (!document.anonymous) {
          r.documentUser = {
            uid: articleUser.uid,
            avatar: articleUser.avatar,
            username: articleUser.username,
          };
        }
        if (column) {
          r.column = column;
        }
        r.title = elasticSearch.replaceSearchResultHTMLLink(r.title + '');
        r.abstract = elasticSearch.replaceSearchResultHTMLLink(r.abstract + '');
      } else if (docType === 'document_comment') {
        //comment搜索
        const comment = commentObj[tid];
        if (!comment) {
          continue;
        }
        const { uid, commentDocument, articleDocument, url, commentUrl } =
          comment;
        const commentUser = userObj[uid];
        r = {
          docNumber: highlightObj[`${tid}_tid`],
          source: commentDocument.source,
          documentId: commentDocument._id,
          commentId: comment._id,
          docType,
          articleUrl: url,
          commentUrl: commentUrl,
          articleTitle: articleDocument.title,
          abstract:
            highlightObj[`${tid}_tid`] ||
            highlightObj[`${tid}_authors`] ||
            highlightObj[`${tid}_content`] ||
            '内容：' +
              (commentDocument.l === 'json'
                ? getJsonStringTextSlice(commentDocument.content, 200)
                : nkcModules.apiFunction.obtainPureText(
                    commentDocument.content,
                    true,
                    200,
                  )),
          articleTime: articleDocument.toc,
          commentTime: commentDocument.toc,
          user: commentUser,
        };
        r.articleTitle = elasticSearch.replaceSearchResultHTMLLink(
          r.articleTitle + '',
        );
        r.abstract = elasticSearch.replaceSearchResultHTMLLink(r.abstract + '');
        if (!commentDocument.anonymous) {
          r.commentUser = {
            uid: commentUser.uid,
            avatar: commentUser.avatar,
            username: commentUser.username,
          };
        }
      } else if (docType === 'document_moment') {
        const moment = momentObj[tid];
        if (!moment) {
          continue;
        }
        r = {
          docType,
          time: moment.toc,
          user: userObj[moment.uid],
          docNumber: highlightObj[`${tid}_tid`],
          abstract:
            highlightObj[`${tid}_content`] ||
            '内容：' +
              nkcModules.apiFunction.obtainPureText(moment.plain, true, 200),
          url: moment.url,
        };
      }
      data.results.push(r);
    }
  }

  if (data.user) {
    data.userSubscribeUsersId = await db.SubscribeModel.getUserSubUsersId(
      data.user.uid,
    );
    data.subColumnsId = await db.SubscribeModel.getUserSubColumnsId(
      data.user.uid,
    );
  }

  data.permissions = {
    bandUser: ctx.permissionsOr(['unBannedUser', 'bannedUser']),
    clearUserInfo: ctx.permission('clearUserInfo'),
  };
  data.time = Date.now() - time;
  data.forums = await db.ForumModel.getForumsTree(
    data.userRoles,
    data.userGrade,
    data.user,
  );
  data.threadCategories = await db.ThreadCategoryModel.getCategoryTree({
    disabled: false,
  });
  ctx.template = 'search/search.pug';
  await next();
});
module.exports = router;
