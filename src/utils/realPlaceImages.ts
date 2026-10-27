// src/utils/realPlaceImages.ts
//
// Fetches REAL photographs of places / dishes from Wikipedia + Wikimedia Commons
// (free, no API key, CORS-enabled). Nothing is AI-generated and no stock
// placeholder is ever substituted: if no verified photo is found, `null` is
// returned and the UI shows a neutral "photo unavailable" tile.
//
// Safeguards against wrong / duplicate images:
//  1. Candidate page/file title must match the place name (token scoring).
//  2. Logos, maps, flags, SVGs, diagrams are rejected.
//  3. The same image URL can never be claimed by two different places.
//  4. Results are cached (memory + localStorage) so each place is fetched once.

export type PlaceImageKind = "place" | "food";

export interface RealImageResult {
  url: string;
  pageUrl: string;
  source: "Wikipedia" | "Wikimedia Commons";
  title: string;
}

interface Candidate {
  title: string;
  url: string;
  pageUrl: string;
  source: RealImageResult["source"];
}

const CACHE_PREFIX = "tourenvi.realimg.v1.";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_PARALLEL = 4;
const MIN_MATCH_SCORE = 0.6;

const memory = new Map<string, RealImageResult | null>();
const inflight = new Map<string, Promise<RealImageResult | null>>();
const claimedUrls = new Map<string, string>(); // image url -> cache key that owns it

/* ----------------------------- small utilities ---------------------------- */

const STOP = new Set(["the", "of", "and", "in", "at", "a", "an", "to", "near", "on", "for"]);
const GENERIC = new Set([
  "temple", "fort", "palace", "beach", "falls", "waterfall", "waterfalls", "museum",
  "hill", "hills", "dam", "lake", "garden", "gardens", "church", "mosque", "sri",
  "shri", "sree", "sacred", "heart", "old", "new", "east", "west", "north", "south",
  "tourist", "view", "point", "park", "complex", "tamil", "nadu", "india",
  "food", "special", "famous", "style",
]);
const BAD_FILE = /(logo|map|locator|flag|seal|emblem|coat[_ ]of[_ ]arms|diagram|plan|chart|signature|icon|symbol|banner)/i;

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const tokens = (s: string) =>
  norm(s)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));

const significant = (t: string[]) => {
  const s = t.filter((x) => !GENERIC.has(x));
  return s.length ? s : t;
};

function matchScore(variant: string, title: string): number {
  const need = significant(tokens(variant));
  if (!need.length) return 0;
  const have = tokens(title);
  const haveSet = new Set(have);
  let hit = 0;
  for (const w of need) {
    if (
      haveSet.has(w) ||
      have.some(
        (x) =>
          x.length >= 5 &&
          w.length >= 5 &&
          x.slice(0, 5) === w.slice(0, 5) &&
          Math.abs(x.length - w.length) <= 3,
      )
    ) {
      hit++;
    }
  }
  return hit / need.length;
}

function buildVariants(name: string, kind: PlaceImageKind): string[] {
  const out: string[] = [];
  const push = (s?: string) => {
    const v = (s || "").replace(/\s+/g, " ").trim();
    if (v.length > 2 && !out.some((o) => o.toLowerCase() === v.toLowerCase())) out.push(v);
  };

  const parens = [...name.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]);
  const base = name.replace(/\([^)]*\)/g, " ").trim();

  if (kind === "food") {
    base.split(/\s*(?:&|\/|\band\b|,|\+)\s*/i).forEach(push);
    parens.forEach((p) => p.split(/\s*[-–,]\s*/).forEach(push));
    return out.slice(0, 3);
  }

  push(base);
  base.split(/\s*(?:,|&|\s[-–—]\s|\|)\s*/).forEach(push);
  parens.forEach((p) => p.split(/\s+[-–—]\s+|,/).forEach(push));
  return out.slice(0, 4);
}

async function fetchJson(url: string, timeoutMs = 8000): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Simple concurrency limiter so 20+ cards don't hammer the API at once.
let active = 0;
const waiting: Array<() => void> = [];
async function limited<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_PARALLEL) await new Promise<void>((r) => waiting.push(r));
  active++;
  try {
    return await fn();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

/* ------------------------------ API searches ------------------------------ */

const enc = encodeURIComponent;

async function searchWikipedia(q: string): Promise<Candidate[]> {
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*` +
    `&generator=search&gsrsearch=${enc(q)}&gsrlimit=6&gsrnamespace=0` +
    `&prop=pageimages|info&inprop=url&piprop=thumbnail&pithumbsize=900&pilicense=any`;
  const json = await limited(() => fetchJson(url));
  const pages = Object.values(json?.query?.pages ?? {}) as any[];
  pages.sort((a, b) => (a.index ?? 99) - (b.index ?? 99));
  return pages
    .filter((p) => p.thumbnail?.source && !/^list of/i.test(p.title))
    .map((p) => ({
      title: p.title as string,
      url: p.thumbnail.source as string,
      pageUrl: (p.fullurl as string) || `https://en.wikipedia.org/wiki/${enc(p.title)}`,
      source: "Wikipedia" as const,
    }));
}

async function searchCommons(q: string): Promise<Candidate[]> {
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*` +
    `&generator=search&gsrsearch=${enc(q)}&gsrnamespace=6&gsrlimit=8` +
    `&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=900`;
  const json = await limited(() => fetchJson(url));
  const pages = Object.values(json?.query?.pages ?? {}) as any[];
  pages.sort((a, b) => (a.index ?? 99) - (b.index ?? 99));
  return pages
    .map((p) => ({ p, info: p.imageinfo?.[0] }))
    .filter(
      ({ info }) =>
        info &&
        info.mime === "image/jpeg" &&
        (info.width ?? 0) >= 600 &&
        (info.thumburl || info.url),
    )
    .map(({ p, info }) => ({
      title: String(p.title).replace(/^File:/i, "").replace(/\.[a-z0-9]+$/i, ""),
      url: (info.thumburl || info.url) as string,
      pageUrl: `https://commons.wikimedia.org/wiki/${enc(String(p.title).replace(/ /g, "_"))}`,
      source: "Wikimedia Commons" as const,
    }));
}

/* ------------------------------ cache helpers ----------------------------- */

const keyFor = (name: string, city: string, kind: PlaceImageKind) =>
  `${kind}|${norm(name)}|${norm(city)}`;

function readCache(key: string): RealImageResult | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.result?.url || Date.now() - parsed.t > CACHE_TTL_MS) return null;
    return parsed.result as RealImageResult;
  } catch {
    return null;
  }
}

function writeCache(key: string, result: RealImageResult) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), result }));
  } catch {
    /* storage full / blocked – ignore */
  }
}

/* -------------------------------- resolver -------------------------------- */

function acceptable(c: Candidate, variants: string[], key: string): boolean {
  const file = (() => {
    try {
      return decodeURIComponent(c.url.split("/").pop() || "");
    } catch {
      return c.url;
    }
  })();
  if (/\.(svg|gif)(\.|$)/i.test(file) || /\.svg/i.test(c.url)) return false;
  if (BAD_FILE.test(file) && !variants.some((v) => BAD_FILE.test(v))) return false;
  const owner = claimedUrls.get(c.url);
  if (owner && owner !== key) return false; // never reuse the same photo for another place
  const best = Math.max(...variants.map((v) => matchScore(v, c.title)));
  return best >= MIN_MATCH_SCORE;
}

async function resolve(
  name: string,
  city: string,
  kind: PlaceImageKind,
  key: string,
): Promise<RealImageResult | null> {
  const variants = buildVariants(name, kind);
  if (!variants.length) return null;

  const queries: string[] = [];
  const addQ = (q: string) => {
    if (!queries.some((x) => x.toLowerCase() === q.toLowerCase())) queries.push(q);
  };
  if (kind === "food") {
    variants.forEach((v) => addQ(v));
    variants.slice(0, 2).forEach((v) => addQ(`${v} ${city}`));
  } else {
    addQ(`${variants[0]} ${city}`);
    variants.forEach((v) => addQ(v));
    variants.slice(1, 3).forEach((v) => addQ(`${v} ${city}`));
  }

  const take = (c: Candidate): RealImageResult => {
    claimedUrls.set(c.url, key);
    return { url: c.url, pageUrl: c.pageUrl, source: c.source, title: c.title };
  };

  // 1) Wikipedia article lead images (best quality, correct subject)
  for (const q of queries.slice(0, 5)) {
    try {
      const cands = await searchWikipedia(q);
      const hit = cands.find((c) => acceptable(c, variants, key));
      if (hit) return take(hit);
    } catch {
      /* try next query */
    }
  }

  // 2) Wikimedia Commons photo search
  for (const q of queries.slice(0, 3)) {
    try {
      const cands = await searchCommons(q);
      const hit = cands.find((c) => acceptable(c, variants, key));
      if (hit) return take(hit);
    } catch {
      /* try next query */
    }
  }

  return null; // honest "no verified photo" – UI shows a neutral tile
}

/* --------------------------------- public --------------------------------- */

/** Synchronous cache peek (avoids a loading flicker on re-render). */
export function peekRealPlaceImage(
  name: string,
  city: string,
  kind: PlaceImageKind = "place",
): RealImageResult | null | undefined {
  const key = keyFor(name, city, kind);
  if (memory.has(key)) return memory.get(key);
  const cached = readCache(key);
  if (cached) {
    memory.set(key, cached);
    claimedUrls.set(cached.url, key);
    return cached;
  }
  return undefined; // unknown yet
}

export function getRealPlaceImage(
  name: string,
  city: string,
  kind: PlaceImageKind = "place",
): Promise<RealImageResult | null> {
  const key = keyFor(name, city, kind);

  const known = peekRealPlaceImage(name, city, kind);
  if (known !== undefined) return Promise.resolve(known);

  const pending = inflight.get(key);
  if (pending) return pending;

  const p = resolve(name, city, kind, key)
    .then((result) => {
      memory.set(key, result);
      if (result) writeCache(key, result);
      return result;
    })
    .catch(() => {
      memory.set(key, null);
      return null;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, p);
  return p;
}