const testRouter = require('koa-router')();
const { OnlyOperation } = require('../middlewares/permission');
const { Operations } = require('../settings/operations');
testRouter
  .get('/', OnlyOperation(Operations.test), async (ctx, next) => {
    ctx.template = 'test/test.pug';
    await next();
  })
  .get('/demo', OnlyOperation(Operations.test), async (ctx, next) => {
    ctx.template = 'test/demo.pug';
    await next();
  })
  .get('/file', OnlyOperation(Operations.test), async (ctx, next) => {
    await next();
  })
  .get('/json', OnlyOperation(Operations.test), async (ctx, next) => {
    await next();
  })
  .post('/', OnlyOperation(Operations.test), async (ctx, next) => {
    await next();
  });

module.exports = testRouter;
