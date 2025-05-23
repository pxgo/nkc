const {
  OnlyOperation,
  OnlyUnbannedUser,
} = require('../../../../middlewares/permission');
const { Operations } = require('../../../../settings/operations');

const router = require('koa-router')();
router.post('/', OnlyUnbannedUser(), async (ctx, next) => {
  const { db, data, state } = ctx;
  const { fund, applicationForm } = data;
  if (
    !(await fund.isFundRole(state.uid, 'admin')) &&
    !(await fund.isFundRole(state.uid, 'financialStaff'))
  ) {
    ctx.throw(403, `权限不足`);
  }
  await applicationForm.adminUpdateRefundStatus(state.uid);
  await next();
});
module.exports = router;
