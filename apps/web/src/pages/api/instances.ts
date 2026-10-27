import type { APIRoute } from 'astro';

import { fetchInstanceHosts } from '../../lib/instances';

/**
 * インストール先ホストの候補を返す。
 *
 * 上流の Misskey サーバー一覧 API は `Origin` 付きのリクエストに
 * `Access-Control-Allow-Origin` を返さずブラウザから直接取得できないため、
 * このルートを同一オリジンのプロキシとして使う。
 */
export const prerender = false;

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
};

export const GET: APIRoute = async () => {
  const hosts = await fetchInstanceHosts();

  // 取得に失敗した場合はキャッシュさせず、ブラウザ側のビルド時候補に任せる
  if (hosts.length === 0) {
    return new Response(JSON.stringify({ hosts: [] }), {
      headers: { ...JSON_HEADERS, 'Cache-Control': 'no-store' },
      status: 503,
    });
  }

  // 上流 API の Cache-Control (max-age=3600) に合わせる
  return new Response(JSON.stringify({ hosts }), {
    headers: { ...JSON_HEADERS, 'Cache-Control': 'public, max-age=3600' },
    status: 200,
  });
};
