import type { APIRoute } from 'astro';

import type { Plugin } from '../../../lib/plugins';
import { plugins } from '../../../lib/plugins';

export function getStaticPaths() {
  return plugins.map((plugin) => ({
    params: { slug: plugin.slug },
    props: { plugin },
  }));
}

/**
 * Misskey の `fetch-external-resources` が取得する配布用 JSON。
 * @see https://misskey-hub.net/ja/docs/for-developers/publish-on-your-website/
 */
export const GET: APIRoute = ({ props }) => {
  const { plugin } = props as { plugin: Plugin; };

  return new Response(JSON.stringify({ type: 'plugin', data: plugin.source }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
};
