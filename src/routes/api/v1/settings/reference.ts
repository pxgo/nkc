import Router from 'koa-router';
import * as Koa from 'koa';
import { OnlyUser } from '@/middlewares/permission';
import { referenceService } from '@/services/reference/reference.service';
import { referenceCheckerService } from '@/services/reference/referenceChecker.service';
import { IReferenceType } from '@/dataModels/ReferencesModel';

export const referenceRouter = new Router<
  Koa.DefaultState,
  Koa.DefaultContext
>();

type IReferenceBody = {
  type: IReferenceType;
  title: string;
  authors: string[];
  journal: string;
  publisher: string;
  year: number | null;
  volume: string;
  issue: string;
  startPage: number | null;
  endPage: number | null;
  doi: string;
  url: string;
};

referenceRouter.get('/', OnlyUser(), async (ctx, next) => {
  const page = ctx.query.page ? parseInt(ctx.query.page as string, 10) : 0;
  const perPage = 30;
  const { references, paging } = await referenceService.getReferences({
    uid: ctx.state.uid,
    page: page,
    perPage: perPage,
  });
  ctx.apiData = {
    references,
    paging,
  };
  await next();
});

referenceRouter.post('/', OnlyUser(), async (ctx, next) => {
  const reference = ctx.body.reference as IReferenceBody;
  await referenceCheckerService.checkReference(reference);
  await referenceService.createReference({
    ...reference,
    uid: ctx.state.uid,
  });
  await next();
});

referenceRouter.del('/', OnlyUser(), async (ctx, next) => {
  const reference = ctx.query.referenceId as string;
  await referenceService.deleteReference(ctx.state.uid, reference);
  await next();
});
