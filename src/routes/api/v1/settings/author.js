const router = require('koa-router')();
const { OnlyUser } = require('@/middlewares/permission');
const {
  authorCreatorService,
} = require('@/services/author/authorCreator.service');
const {
  authorCheckerService,
} = require('@/services/author/authorChecker.service');
const {
  authorFinderService,
} = require('@/services/author/authorFinder.service');
const {
  authorUpdaterService,
} = require('@/services/author/authorUpdater.service');
const { authorPhotoService } = require('@/services/author/authorPhoto.service');

router
  .get('/', OnlyUser(), async (ctx, next) => {
    const authors = await authorFinderService.getAuthorsByUserId(
      ctx.state.uid,
      ctx.query.status === 'deleted' ? 'deleted' : 'normal',
    );
    ctx.apiData = {
      authors,
    };
    await next();
  })
  .post('/', OnlyUser(), async (ctx, next) => {
    const author = JSON.parse(ctx.body.fields.author);
    const photoFile = ctx.body.files.photo;
    await authorCheckerService.checkAuthorInfo(author);
    if (photoFile) {
      author.photo = await authorPhotoService.saveAuthorPhoto(
        ctx.state.uid,
        photoFile,
      );
    }
    await authorCreatorService.createAuthor(ctx.state.uid, author);
    await next();
  })
  .patch('/', OnlyUser(), async (ctx, next) => {
    await authorUpdaterService.restoreAuthorById(
      ctx.state.uid,
      ctx.query.authorId,
    );
    await next();
  })
  .del('/', OnlyUser(), async (ctx, next) => {
    await authorUpdaterService.deleteAuthorById(
      ctx.state.uid,
      ctx.query.authorId,
    );
    await next();
  });

module.exports = router;
