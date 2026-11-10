/**
 * Generative tree (Plan.md Phase 5). Deterministic: the same seed and state
 * always give the same drawing. No DOM — returns an SVG string, so it can be
 * unit-tested and reused on the fixture page.
 *
 * Structure: a full branch skeleton is generated once from the seed; how much
 * of it is visible depends on grownTotal (never shrinks, Plan.md 2.4: wilting
 * costs no structure). Leaves and buds fill leaf slots in a fixed order.
 */
import type { TreeState } from '../domain/types';

export const VIEW_W = 320;
export const VIEW_H = 340;
export const GROUND_Y = 310;
/** Minimum visible height above the ground (young trees). */
const MIN_SKY = 190;
const MAX_DEPTH = 7;

/** Small seeded PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Branch {
  x1: number; y1: number; x2: number; y2: number;
  width: number;
  depth: number;
}
export interface Spot { x: number; y: number; angle: number }

export interface TreeModel {
  branches: Branch[];
  leaves: Spot[];
  buds: Spot[];
  litter: Spot[];
  /** Leaves that do not fit any more (very long habits): counted, not drawn. */
  hiddenLeaves: number;
  vitality: number;
}

interface Skeleton { branches: Branch[]; slots: Spot[][] }

const skeletonCache = new Map<string, Skeleton>();

/** Full skeleton in breadth-first order; slots[i] are the leaf slots of branch i. */
function skeleton(seed: number, droop: number): Skeleton {
  const key = `${seed}:${droop}`;
  const cached = skeletonCache.get(key);
  if (cached) return cached;
  const r = rng(seed);
  const branches: Branch[] = [];
  const slots: Spot[][] = [];
  const queue: { x: number; y: number; angle: number; len: number; width: number; depth: number }[] = [
    { x: VIEW_W / 2, y: GROUND_Y, angle: -Math.PI / 2 + (r() - 0.5) * 0.1, len: 74, width: 13, depth: 0 },
  ];
  while (queue.length > 0) {
    const b = queue.shift() as (typeof queue)[number];
    // Wilting: branches hang a little (vitality only, structure stays).
    const angle = b.angle + droop * (b.depth / MAX_DEPTH) * Math.sign(Math.cos(b.angle) || 1) * 0.5;
    const x2 = b.x + Math.cos(angle) * b.len;
    const y2 = b.y + Math.sin(angle) * b.len;
    branches.push({ x1: b.x, y1: b.y, x2, y2, width: b.width, depth: b.depth });
    const own: Spot[] = [];
    if (b.depth >= 1) {
      for (const t of [0.45, 0.75, 1]) {
        const side = own.length % 2 === 0 ? 1 : -1;
        const off = 5 + r() * 4;
        own.push({
          x: b.x + (x2 - b.x) * t + Math.cos(angle + side * Math.PI / 2) * off * (t < 1 ? 1 : 0.3),
          y: b.y + (y2 - b.y) * t + Math.sin(angle + side * Math.PI / 2) * off * (t < 1 ? 1 : 0.3),
          angle: (angle * 180) / Math.PI + side * (35 + r() * 30),
        });
      }
    }
    slots.push(own);
    if (b.depth < MAX_DEPTH) {
      const children = b.depth === 0 ? 3 : r() < 0.3 ? 3 : 2;
      for (let i = 0; i < children; i++) {
        const spread = children === 3 ? (i - 1) * 0.55 : (i === 0 ? -1 : 1) * (0.35 + r() * 0.25);
        queue.push({
          x: x2, y: y2,
          angle: angle + spread + (r() - 0.5) * 0.25,
          len: b.len * (0.72 + r() * 0.1),
          width: Math.max(1.2, b.width * 0.66),
          depth: b.depth + 1,
        });
      }
    }
  }
  const result = { branches, slots };
  skeletonCache.set(key, result);
  return result;
}

/** Visible branches for a given growth: small sapling first, full crown after a long time. */
export function visibleBranchCount(grownTotal: number, total: number): number {
  return Math.min(total, 4 + Math.ceil(grownTotal * 0.6));
}

export function buildTree(seed: number, state: TreeState): TreeModel {
  const droop = state.status === 'wilting' ? 1 : 0;
  const sk = skeleton(seed, droop);
  // Only real growth (grownTotal) drives the structure; buds may expire. The slot
  // budget (3 per branch) always leaves room for the week's buds.
  const visible = visibleBranchCount(state.grownTotal, sk.branches.length);
  const branches = sk.branches.slice(0, visible);
  const slots = sk.slots.slice(0, visible).flat();
  const leaves = slots.slice(0, state.leaves);
  const buds = slots.slice(leaves.length, leaves.length + state.buds);

  const r = rng(seed ^ 0x9e3779b9);
  const litter: Spot[] = [];
  const drawnLitter = Math.min(state.litter, 80);
  for (let i = 0; i < drawnLitter; i++) {
    const spread = 40 + Math.min(110, drawnLitter * 2.5);
    litter.push({ x: VIEW_W / 2 + (r() - 0.5) * 2 * spread, y: GROUND_Y + 3 + r() * 14, angle: r() * 360 });
  }
  return { branches, leaves, buds, litter, hiddenLeaves: state.leaves - leaves.length, vitality: state.vitality };
}

const f = (n: number) => n.toFixed(1);
const LEAF_PATH = 'M0 0 C 3 -4 9 -4 12 0 C 9 4 3 4 0 0 Z';

export interface RenderOptions {
  /** Accessible description (aria-label of the image). */
  label: string;
  /** Number of newest leaves to animate as growing. */
  newLeaves?: number;
  /** Number of newest litter leaves to animate as falling. */
  newLitter?: number;
  /** Litter blown away since the last visit (wind animation). */
  windCleared?: number;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function renderTreeSvg(model: TreeModel, opts: RenderOptions): string {
  const wilting = model.vitality < 1;
  const parts: string[] = [];
  // Crop empty sky above a young tree, but keep a minimum height so growth stays visible.
  const top = Math.max(0, Math.min(GROUND_Y - MIN_SKY, ...model.branches.map((b) => Math.min(b.y1, b.y2) - 24)));
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${f(top)} ${VIEW_W} ${f(VIEW_H - top)}" role="img" aria-label="${escapeAttr(opts.label)}" class="tree${wilting ? ' wilting' : ''}">`,
  );
  parts.push(`<ellipse class="ground" cx="${VIEW_W / 2}" cy="${GROUND_Y + 10}" rx="${VIEW_W / 2 - 10}" ry="16"/>`);
  for (const b of model.branches) {
    parts.push(
      `<line class="branch" x1="${f(b.x1)}" y1="${f(b.y1)}" x2="${f(b.x2)}" y2="${f(b.y2)}" stroke-width="${f(b.width)}"/>`,
    );
  }
  const newFrom = model.leaves.length - (opts.newLeaves ?? 0);
  model.leaves.forEach((s, i) => {
    const cls = i >= newFrom ? 'leaf new' : 'leaf';
    parts.push(`<g transform="translate(${f(s.x)} ${f(s.y)}) rotate(${f(s.angle)})"><path class="${cls}" d="${LEAF_PATH}"/></g>`);
  });
  for (const s of model.buds) {
    parts.push(`<circle class="bud" cx="${f(s.x)}" cy="${f(s.y)}" r="2.6"/>`);
  }
  const fallFrom = model.litter.length - (opts.newLitter ?? 0);
  model.litter.forEach((s, i) => {
    const cls = i >= fallFrom ? 'litter falling' : 'litter';
    parts.push(
      `<g transform="translate(${f(s.x)} ${f(s.y)})"><path class="${cls}" style="--i:${i % 7}" d="${LEAF_PATH}" transform="rotate(${f(s.angle)}) scale(0.8)"/></g>`,
    );
  });
  if (opts.windCleared) {
    for (let i = 0; i < Math.min(opts.windCleared, 20); i++) {
      const x = VIEW_W / 2 + ((i * 37) % 200) - 100;
      parts.push(
        `<g transform="translate(${x} ${GROUND_Y + 8})"><path class="litter blown" style="--i:${i % 7}" d="${LEAF_PATH}"/></g>`,
      );
    }
  }
  parts.push('</svg>');
  return parts.join('');
}
