/**
 * インストール先ホストの入力候補を、Misskey サーバー一覧 API からビルド時に取得する。
 *
 * API は `{ items, total, limit, offset }` を返し、`limit` の上限は 100。
 * 取得に失敗してもビルドを止めず、候補なしで続行する。
 */
const INSTANCES_API = 'https://servers.misskey.ink/api/v1/instances';

/** API が受け付ける 1 ページあたりの最大件数 */
const PAGE_LIMIT = 100;

/** 無限ループを避けるための安全弁（最大 2,000 件まで） */
const MAX_PAGES = 20;

/** 1 リクエストあたりのタイムアウト */
const REQUEST_TIMEOUT_MS = 5_000;

type InstanceItem = {
  host?: unknown;
  users_count?: unknown;
  is_alive?: unknown;
};

type InstancesResponse = {
  items?: unknown;
  total?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function fetchPage(offset: number): Promise<InstancesResponse | null> {
  const url = new URL(INSTANCES_API);
  url.searchParams.set('limit', String(PAGE_LIMIT));
  url.searchParams.set('offset', String(offset));

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) return null;
    return (await response.json()) as InstancesResponse;
  } catch {
    return null;
  }
}

export async function fetchInstanceHosts(): Promise<string[]> {
  /** host → ユーザー数（重複した場合は大きい方を採用） */
  const usersCountByHost = new Map<string, number>();

  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_LIMIT;
    const data = await fetchPage(offset);
    const items = data?.items;
    if (!Array.isArray(items) || items.length === 0) break;

    for (const item of items) {
      if (!isRecord(item)) continue;

      const { host, is_alive: isAlive, users_count: usersCount } = item as InstanceItem;
      if (typeof host !== 'string' || host === '') continue;
      if (isAlive === false) continue;

      const count = typeof usersCount === 'number' && Number.isFinite(usersCount) ? usersCount : 0;
      usersCountByHost.set(host, Math.max(usersCountByHost.get(host) ?? 0, count));
    }

    const total = data?.total;
    if (typeof total === 'number' && offset + items.length >= total) break;
  }

  return [...usersCountByHost.entries()]
    .sort(([hostA, countA], [hostB, countB]) => countB - countA || hostA.localeCompare(hostB, 'en'))
    .map(([host]) => host);
}

let cache: Promise<string[]> | null = null;

/**
 * ビルド時に使う候補一覧。ユーザー数の多い順。
 * 同一ビルド内では 1 回だけ取得する。
 */
export function getInstanceHosts(): Promise<string[]> {
  cache ??= fetchInstanceHosts();
  return cache;
}
