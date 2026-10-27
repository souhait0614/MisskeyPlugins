import { createHash } from 'node:crypto';

import { Interpreter, Parser, utils } from '@syuilo/aiscript';

/**
 * Misskey が外部リソースを取得・検証するときの実装に合わせる。
 * @see https://github.com/misskey-dev/misskey/blob/develop/packages/backend/src/server/api/endpoints/fetch-external-resources.ts
 */
const MIN_AISCRIPT_VERSION = '0.12.0';

export type PluginConfigItem = {
  type?: string;
  label?: string;
  description?: string;
  default?: unknown;
  [key: string]: unknown;
};

export type PluginMeta = {
  name: string;
  version: string;
  author: string;
  description?: string;
  permissions: string[];
  config: Record<string, PluginConfigItem>;
};

export type Plugin = {
  slug: string;
  fileName: string;
  /** LF に正規化したプラグインのソースコード */
  source: string;
  /** ソースコードの SHA-512 (16 進小文字) */
  hash: string;
  /** `/// @ x.y.z` で宣言された AiScript のバージョン */
  langVersion: string;
  meta: PluginMeta;
};

// モノレポ直下の src/*.ais を唯一のソースとする。
// `?raw` で読み込むことで開発サーバーでも変更が反映される。
const sources = import.meta.glob<string>('../../../../src/*.ais', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseVersion(value: string): [number, number, number] | null {
  const match = (/^(\d+)\.(\d+)\.(\d+)/).exec(value);
  if (match == null) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isSupportedAiScriptVersion(version: string): boolean {
  const parsed = parseVersion(version);
  const min = parseVersion(MIN_AISCRIPT_VERSION);
  if (parsed == null || min == null) return false;

  const [parsedMajor, parsedMinor, parsedPatch] = parsed;
  const [minMajor, minMinor, minPatch] = min;

  if (parsedMajor !== minMajor) return parsedMajor > minMajor;
  if (parsedMinor !== minMinor) return parsedMinor > minMinor;
  return parsedPatch >= minPatch;
}

/** Misskey と同じ手順（CRLF を LF に統一して SHA-512）でハッシュを計算する */
function hashSource(source: string): string {
  return createHash('sha512').update(source.replace(/\r\n/g, '\n')).digest('hex');
}

function parseMeta(fileName: string, source: string): { meta: PluginMeta; langVersion: string; } {
  const langVersion = utils.getLangVersion(source);
  if (langVersion == null) {
    throw new Error(`${fileName}: 言語バージョンの宣言 (/// @ x.y.z) がありません`);
  }
  if (!isSupportedAiScriptVersion(langVersion)) {
    throw new Error(
      `${fileName}: AiScript ${MIN_AISCRIPT_VERSION} 以上が必要です（宣言: ${langVersion}）`,
    );
  }

  let ast;
  try {
    ast = new Parser().parse(source);
  } catch (error) {
    throw new Error(`${fileName}: AiScript の構文エラー: ${String(error)}`);
  }

  const metadata = Interpreter.collectMetadata(ast)?.get(null);
  if (!isRecord(metadata)) {
    throw new Error(`${fileName}: メタ情報 (### { ... }) が見つかりません`);
  }

  const { name, version, author, description, permissions, config } = metadata;
  if (typeof name !== 'string' || typeof version !== 'string' || typeof author !== 'string') {
    throw new Error(`${fileName}: name / version / author は必須です`);
  }

  const normalizedConfig: Record<string, PluginConfigItem> = {};
  if (isRecord(config)) {
    for (const [key, value] of Object.entries(config)) {
      if (isRecord(value)) {
        normalizedConfig[key] = value as PluginConfigItem;
      }
    }
  }

  return {
    langVersion,
    meta: {
      name,
      version,
      author,
      description: typeof description === 'string' ? description : undefined,
      permissions: Array.isArray(permissions)
        ? permissions.filter((permission): permission is string => typeof permission === 'string')
        : [],
      config: normalizedConfig,
    },
  };
}

export const plugins: Plugin[] = Object.entries(sources)
  .map(([path, raw]) => {
    const fileName = path.split('/').pop() ?? path;
    const slug = fileName.replace(/\.ais$/, '');
    const source = raw.replace(/\r\n/g, '\n');
    const { meta, langVersion } = parseMeta(fileName, source);

    return { slug, fileName, source, hash: hashSource(source), langVersion, meta };
  })
  .sort((a, b) => a.slug.localeCompare(b.slug, 'en'));

export function getApiPath(slug: string): string {
  return `/api/plugins/${slug}.json`;
}
