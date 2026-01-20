import 'koa';

declare module 'koa' {
  interface DefaultState {
    uid: string;
  }
  interface DefaultContext {
    apiData?: unknown;
  }
}
