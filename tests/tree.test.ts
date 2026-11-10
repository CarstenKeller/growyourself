/** Phase 5: tree model and SVG. */
import { describe, expect, it } from 'vitest';
import { addDays } from '../src/domain/calendar';
import { computeTreeState } from '../src/domain/rules';
import { buildTree, renderTreeSvg, rng, visibleBranchCount } from '../src/tree/tree';
import { MON, Records, at, habit, week } from './helpers';

const stateAfter = (r: Records, now: Date) => computeTreeState(habit(), r, now);

describe('tree', () => {
  it('rng is deterministic', () => {
    const a = rng(1); const b = rng(1);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(rng(2)()).not.toBe(rng(1)());
  });

  it('same seed and state give the same SVG; another seed a different one', () => {
    const s = stateAfter(new Records().days_(MON, 10), at(addDays(MON, 9), 22));
    const svg = (seed: number) => renderTreeSvg(buildTree(seed, s), { label: 'x' });
    expect(svg(42)).toBe(svg(42));
    expect(svg(43)).not.toBe(svg(42));
  });

  it('draws exactly the leaves, buds and litter of the state', () => {
    const r = new Records();
    r.days_(MON, 7).day(addDays(MON, 2), 'no');      // week 0 unbalanced: 6 fall
    r.days_(week(1), 7).day(addDays(week(1), 2), 'no'); // week 1 unbalanced: 6 fall -> stagnating
    r.days_(week(2), 2);                              // 2 buds; streak 6, so no wind yet
    const s = stateAfter(r, at(addDays(week(2), 1), 22));
    expect(s).toMatchObject({ leaves: 1, buds: 2, litter: 12, status: 'stagnating' });
    const m = buildTree(7, s);
    expect(m.leaves).toHaveLength(1);
    expect(m.buds).toHaveLength(2);
    expect(m.litter).toHaveLength(12);
    const svg = renderTreeSvg(m, { label: 'Baum "a" & <b>' });
    expect(svg.match(/class="leaf/g)).toHaveLength(1);
    expect(svg.match(/class="bud"/g)).toHaveLength(2);
    expect(svg.match(/class="litter/g)).toHaveLength(12);
    expect(svg).toContain('aria-label="Baum &quot;a&quot; &amp; &lt;b>"');
  });

  it('structure never shrinks — not when leaves fall, not when buds expire; wilting is a visible class', () => {
    const r = new Records();
    for (let n = 0; n < 3; n++) r.days_(week(n), 7).day(addDays(week(n), 2), 'no');
    let prev = 0;
    for (let d = 0; d <= 21; d++) {
      const n = buildTree(1, stateAfter(r, at(addDays(MON, d), 22))).branches.length;
      expect(n).toBeGreaterThanOrEqual(prev);
      prev = n;
    }
    const s3 = stateAfter(r, at(week(3), 10));
    expect(s3.status).toBe('wilting');
    expect(renderTreeSvg(buildTree(1, s3), { label: '' })).toContain('class="tree wilting"');
  });

  it('enough leaf slots for long habits; overflow is counted, not lost', () => {
    const s = stateAfter(new Records().days_(MON, 200), at(addDays(MON, 199), 22));
    const m = buildTree(3, s);
    expect(m.leaves.length + m.hiddenLeaves).toBe(s.leaves);
    expect(visibleBranchCount(0, 1000)).toBe(4);
    expect(visibleBranchCount(10_000, 50)).toBe(50);
  });

  it('marks new leaves, falling litter and wind', () => {
    const s = stateAfter(new Records().days_(MON, 5), at(addDays(MON, 4), 22));
    const svg = renderTreeSvg(buildTree(1, s), { label: '', newLeaves: 2, windCleared: 3 });
    expect(svg.match(/leaf new/g)).toHaveLength(2);
    expect(svg.match(/litter blown/g)).toHaveLength(3);
  });
});

describe('fixture page (Phase 5 acceptance)', () => {
  it('every fixture drawing matches its state', async () => {
    const { FIXTURES } = await import('../src/tree/fixtures');
    const statuses = new Set<string>();
    for (const f of FIXTURES) {
      const s = computeTreeState(f.habit, f.records, f.now);
      statuses.add(s.status);
      const m = buildTree(f.habit.seed, s);
      expect(m.leaves.length + m.hiddenLeaves, f.name.en).toBe(s.leaves);
      expect(m.buds.length, f.name.en).toBe(s.buds);
      expect(m.litter.length, f.name.en).toBe(Math.min(s.litter, 80));
    }
    expect([...statuses].sort()).toEqual(['healthy', 'slowed', 'stagnating', 'wilting']);
  });
});

describe('view box', () => {
  it('young trees are cropped, grown trees use the full height', () => {
    const vb = (days: number) => {
      const s = computeTreeState(habit(), new Records().days_(MON, days), at(addDays(MON, Math.max(0, days - 1)), 22));
      return renderTreeSvg(buildTree(5, s), { label: '' }).match(/viewBox="([^"]+)"/)?.[1];
    };
    expect(vb(0)).toBe('0 120.0 320 220.0');
    const top = Number(vb(150)?.split(' ')[1]);
    expect(top).toBeLessThan(120); // taller tree, more visible height
    expect(top).toBeGreaterThanOrEqual(0);
  });
});
