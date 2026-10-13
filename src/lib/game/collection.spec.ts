import { describe, expect, it } from 'vitest';
import {
	BADGES,
	EMPTY,
	badgeProgress,
	discover,
	earnedBadges,
	hint,
	isDiscovered,
	parseCollection,
	progress
} from './collection';
import { allParticles, getParticle, reactions } from '#lib/physics/index.ts';

describe('collection', () => {
	it('starts with every elementary particle and no composites', () => {
		expect(isDiscovered(EMPTY, 'u')).toBe(true);
		expect(isDiscovered(EMPTY, 'e+')).toBe(true);
		expect(isDiscovered(EMPTY, 'p')).toBe(false);
		expect(earnedBadges(EMPTY)).toEqual([]);
	});

	it('records new composites once and ignores elementary ones', () => {
		const a = discover(EMPTY, ['p', 'u', 'p']);
		expect(a.newParticles).toEqual(['p']);
		expect(isDiscovered(a.collection, 'p')).toBe(true);
		const b = discover(a.collection, ['p']);
		expect(b.newParticles).toEqual([]);
		expect(b.collection).toBe(a.collection);
	});

	it('records reactions as moves', () => {
		const a = discover(EMPTY, ['p', 'e-', 'anti-nu_e'], 'neutron-beta-decay');
		expect(a.collection.reactions).toEqual(['neutron-beta-decay']);
		expect(a.newParticles).toEqual(['p']);
	});

	it('counts progress over particles and reactions', () => {
		const start = progress(EMPTY);
		expect(start.total).toBe(allParticles.length + reactions.length);
		expect(progress(discover(EMPTY, ['n']).collection).found).toBe(start.found + 1);
	});

	it('awards a badge when its set completes, exactly once', () => {
		let c = EMPTY;
		const atoms = ['H-atom', 'D-atom', 'He-atom'];
		let earned: string[] = [];
		for (const id of atoms) {
			const d = discover(c, [id]);
			c = d.collection;
			earned = [...earned, ...d.newBadges.map((b) => b.id)];
		}
		expect(earned).toEqual(['atoms']);
		expect(
			badgeProgress(
				c,
				BADGES.find((b) => b.id === 'atoms')!
			)
		).toEqual({ found: 3, total: 3 });
	});

	it('awards the complete badge only with everything found', () => {
		let c = EMPTY;
		for (const p of allParticles) c = discover(c, [p.id]).collection;
		expect(earnedBadges(c).map((b) => b.id)).not.toContain('complete');
		for (const r of reactions) c = discover(c, [], r.id).collection;
		expect(earnedBadges(c).map((b) => b.id)).toContain('complete');
		expect(progress(c).found).toBe(progress(c).total);
	});

	it('gives hints without the recipe', () => {
		expect(hint(getParticle('p'))).toBe('A hadron made of 3 particles, held by the strong force.');
		expect(hint(getParticle('p'))).not.toMatch(/\bu\b|\bd\b/);
	});
});

describe('parseCollection', () => {
	it('survives missing, corrupt and foreign data', () => {
		expect(parseCollection(null)).toEqual(EMPTY);
		expect(parseCollection('not json')).toEqual(EMPTY);
		expect(parseCollection('{"version":2}')).toEqual(EMPTY);
	});

	it('drops unknown ids', () => {
		const raw = JSON.stringify({
			version: 1,
			particles: ['p', 'unobtainium', 3],
			reactions: ['x']
		});
		expect(parseCollection(raw)).toEqual({
			version: 1,
			particles: ['p'],
			reactions: [],
			puzzles: {},
			balanced: []
		});
	});
});
