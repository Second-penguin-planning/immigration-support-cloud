export { auth as proxy } from '@/server/auth';

// Next.js 16でmiddleware.tsはproxy.tsに改名された。
// 認可の実体は authConfig.callbacks.authorized (src/server/auth/config.ts) にある。
// ここは「保険」であり、各Server Action/Route Handlerでも必ず認可チェックを行う方針(docs/05_security.md)。
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
