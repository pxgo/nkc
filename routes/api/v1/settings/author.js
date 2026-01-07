const router = require('koa-router')();
const { OnlyUser } = require('../../../../middlewares/permission');
const {
  authorCreatorService,
} = require('../../../../services/author/authorCreator.service');
const {
  authorCheckerService,
} = require('../../../../services/author/authorChecker.service');
const {
  authorFinderService,
} = require('../../../../services/author/authorFinder.service');
const {
  authorUpdaterService,
} = require('../../../../services/author/authorUpdater.service');

router
  .get('/', OnlyUser(), async (ctx, next) => {
    const authors = await authorFinderService.getAuthorsByUserId(ctx.state.uid);
    ctx.apiData = {
      authors,
    };
    await next();
  })
  .post('/', OnlyUser(), async (ctx, next) => {
    const author = (ctx.body && ctx.body.author) || {};
    await authorCheckerService.checkAuthorInfo(author);
    await authorCreatorService.createAuthor(ctx.state.uid, author);
    await next();
  })
  .patch('/:id', OnlyUser(), async (ctx, next) => {
    const author = (ctx.body && ctx.body.author) || {};
    await authorCheckerService.checkAuthorInfo(author);
    await authorUpdaterService.updateAuthorInfo(author._id, author);
    await next();
  })
  .del('/:id', OnlyUser(), async (ctx, next) => {
    await authorUpdaterService.deleteAuthorById(ctx.state.uid, ctx.params.id);
    await next();
  });

module.exports = router;
