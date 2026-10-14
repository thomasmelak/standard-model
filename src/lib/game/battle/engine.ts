import { next } from './random';
import {
	DECAYS,
	SURGE_POWER,
	SURGE_TURNS,
	baseDamage,
	battleHp,
	canAnnihilate,
	decayClock,
	effect,
	movesFor,
	speed,
	type MoveId
} from './rules';

// The battle engine: a pure state machine. `step` takes both sides' actions and
// returns a new state plus the events that happened, for the UI to animate and
// narrate. Nothing here mutates its input. See docs/BATTLES.md.

export type SideId = 0 | 1;
export const TEAM_SIZE = 3;
/**
 * A battle still going after this many turns is a draw: the two sides barely interact
 * (think of neutrinos, which only feel the weak force), so neither can claim the win.
 */
export const MAX_TURNS = 30;

export interface Fighter {
	id: string;
	hp: number;
	maxHp: number;
	/** Turns left before it decays; null when stable. */
	clock: number | null;
	/** Turns of Mass Surge left. */
	surge: number;
}

export interface Side {
	team: Fighter[];
	active: number;
}

export type Outcome = SideId | 'draw';

export interface BattleState {
	turn: number;
	/** PRNG state; advances as the battle uses randomness. */
	rng: number;
	sides: [Side, Side];
	winner?: Outcome;
}

export type Action =
	{ type: 'move'; move: MoveId } | { type: 'switch'; to: number } | { type: 'forfeit' };

export type BattleEvent =
	| { type: 'move'; side: SideId; fighter: string; move: MoveId }
	| { type: 'immune'; side: SideId; target: string; reason: string }
	| { type: 'damage'; side: SideId; target: string; amount: number; hp: number }
	| { type: 'clock'; side: SideId; target: string; clock: number }
	| { type: 'surge'; side: SideId; fighter: string }
	| { type: 'decay'; side: SideId; from: string; to: string }
	| { type: 'annihilate'; side: SideId; fighter: string; target: string }
	| { type: 'faint'; side: SideId; fighter: string }
	| { type: 'switch'; side: SideId; from: string; to: string }
	| { type: 'end'; winner: Outcome; reason: 'knockout' | 'forfeit' | 'stalemate' | 'time' };

export function fighter(id: string): Fighter {
	const maxHp = battleHp(id);
	return { id, hp: maxHp, maxHp, clock: decayClock(id), surge: 0 };
}

export function createBattle(seed: number, teamA: string[], teamB: string[]): BattleState {
	for (const team of [teamA, teamB]) {
		if (team.length !== TEAM_SIZE) throw new Error(`A team has exactly ${TEAM_SIZE} particles.`);
	}
	return {
		turn: 0,
		rng: seed >>> 0,
		sides: [
			{ team: teamA.map(fighter), active: 0 },
			{ team: teamB.map(fighter), active: 0 }
		]
	};
}

export const other = (side: SideId): SideId => (side === 0 ? 1 : 0);
export const activeOf = (s: BattleState, side: SideId) => s.sides[side].team[s.sides[side].active];
const alive = (f: Fighter) => f.hp > 0;

/** Every action a side may take now. Immune moves are allowed (the UI greys them out). */
export function legalActions(s: BattleState, side: SideId): Action[] {
	if (s.winner !== undefined) return [];
	const me = activeOf(s, side);
	const foe = activeOf(s, other(side));
	const moves: Action[] = movesFor(me.id, foe.id).map((move) => ({ type: 'move', move }));
	const switches: Action[] = s.sides[side].team
		.map((f, i) => ({ f, i }))
		.filter(({ f, i }) => i !== s.sides[side].active && alive(f))
		.map(({ i }) => ({ type: 'switch', to: i }));
	return [...moves, ...switches, { type: 'forfeit' }];
}

const sameAction = (x: Action, y: Action) =>
	x.type === y.type &&
	(x.type !== 'move' || x.move === (y as typeof x).move) &&
	(x.type !== 'switch' || x.to === (y as typeof x).to);

const isLegal = (s: BattleState, side: SideId, a: Action) =>
	legalActions(s, side).some((l) => sameAction(l, a));

/** A working copy the turn can change freely. */
const clone = (s: BattleState): BattleState => structuredClone(s);

function random(s: BattleState): number {
	const [value, rng] = next(s.rng);
	s.rng = rng;
	return value;
}

/** Plays one turn: switches first, then moves in Speed order, then the decay clocks tick. */
export function step(
	state: BattleState,
	a0: Action,
	a1: Action
): { state: BattleState; events: BattleEvent[] } {
	if (state.winner !== undefined) throw new Error('The battle is over.');
	for (const [side, a] of [
		[0, a0],
		[1, a1]
	] as const) {
		if (!isLegal(state, side, a)) throw new Error(`Illegal action for side ${side}.`);
	}

	const s = clone(state);
	const events: BattleEvent[] = [];
	s.turn++;
	const actions: [Action, Action] = [a0, a1];

	// Forfeits end the battle at once.
	for (const side of [0, 1] as const) {
		if (actions[side].type === 'forfeit') {
			s.winner = other(side);
			events.push({ type: 'end', winner: s.winner, reason: 'forfeit' });
			return { state: s, events };
		}
	}

	// Switches happen before any move.
	for (const side of [0, 1] as const) {
		const a = actions[side];
		if (a.type !== 'switch') continue;
		const from = activeOf(s, side).id;
		s.sides[side].active = a.to;
		events.push({ type: 'switch', side, from, to: activeOf(s, side).id });
	}

	// Moves, faster particle first; ties are broken by the seed.
	const movers = ([0, 1] as const).filter((side) => actions[side].type === 'move');
	if (movers.length === 2) {
		const d = speed(activeOf(s, 1).id) - speed(activeOf(s, 0).id);
		if (d > 0 || (d === 0 && random(s) < 0.5)) movers.reverse();
	}
	// Who chose each move; a replacement sent in after a faint doesn't act this turn.
	const chosenBy = [s.sides[0].active, s.sides[1].active];
	for (const side of movers) {
		const action = actions[side] as Extract<Action, { type: 'move' }>;
		const me = activeOf(s, side);
		if (s.sides[side].active !== chosenBy[side] || !alive(me)) continue;
		// Annihilate needs the same opponent it was chosen against.
		if (!movesFor(me.id, activeOf(s, other(side)).id).includes(action.move)) continue;
		useMove(s, side, action.move, events);
		if (settle(s, events)) return { state: s, events };
	}

	// End of turn: Mass Surge wears off and the active particles' decay clocks tick.
	for (const side of [0, 1] as const) {
		const f = activeOf(s, side);
		if (!alive(f)) continue;
		if (f.surge > 0) f.surge--;
		if (f.clock === null) continue;
		f.clock--;
		if (f.clock <= 0) decay(s, side, events);
	}

	if (!settle(s, events)) {
		if (deadlocked(s)) decide(s, events);
		else if (s.turn >= MAX_TURNS) {
			s.winner = 'draw';
			events.push({ type: 'end', winner: 'draw', reason: 'time' });
		}
	}
	return { state: s, events };
}

/** Ends a battle nobody can progress on the share of HP each side has left. */
function decide(s: BattleState, events: BattleEvent[]) {
	const left = (side: SideId) =>
		s.sides[side].team.reduce((sum, f) => sum + Math.max(0, f.hp) / f.maxHp, 0);
	const d = left(0) - left(1);
	s.winner = d > 0 ? 0 : d < 0 ? 1 : 'draw';
	events.push({ type: 'end', winner: s.winner, reason: 'stalemate' });
}

/**
 * True when nothing can change any more: no particle left on either side can
 * hurt any particle on the other, and none of them will decay.
 */
export function deadlocked(s: BattleState): boolean {
	const [a, b] = s.sides.map((side) => side.team.filter(alive));
	if ([...a, ...b].some((f) => f.clock !== null)) return false;
	const hurts = (x: Fighter, y: Fighter) =>
		movesFor(x.id, y.id).some((m) => m === 'annihilate' || baseDamage(m, x.id, y.id) > 0);
	return !a.some((x) => b.some((y) => hurts(x, y) || hurts(y, x)));
}

function useMove(s: BattleState, side: SideId, move: MoveId, events: BattleEvent[]) {
	const me = activeOf(s, side);
	const foeSide = other(side);
	const foe = activeOf(s, foeSide);
	events.push({ type: 'move', side, fighter: me.id, move });

	if (move === 'higgs') {
		me.surge = SURGE_TURNS;
		events.push({ type: 'surge', side, fighter: me.id });
		return;
	}
	if (move === 'annihilate') {
		if (!canAnnihilate(me.id, foe.id)) return;
		events.push({ type: 'annihilate', side, fighter: me.id, target: foe.id });
		me.hp = 0;
		foe.hp = 0;
		return;
	}

	const { factor, reason } = effect(move, me.id, foe.id);
	if (!factor) {
		events.push({ type: 'immune', side: foeSide, target: foe.id, reason: reason ?? '' });
		return;
	}
	const spread = 0.9 + random(s) * 0.2;
	const surge = me.surge > 0 ? SURGE_POWER : 0;
	const amount = Math.max(1, Math.round(baseDamage(move, me.id, foe.id, surge) * spread));
	foe.hp = Math.max(0, foe.hp - amount);
	events.push({ type: 'damage', side: foeSide, target: foe.id, amount, hp: foe.hp });

	// The weak force drives decays: a hit brings an unstable target's decay closer.
	if (move === 'weak' && foe.clock !== null && foe.hp > 0) {
		foe.clock = Math.max(0, foe.clock - 1);
		events.push({ type: 'clock', side: foeSide, target: foe.id, clock: foe.clock });
	}
}

/** Replaces a particle whose clock ran out with its decay product, keeping its HP fraction. */
function decay(s: BattleState, side: SideId, events: BattleEvent[]) {
	const f = activeOf(s, side);
	const to = DECAYS[f.id];
	if (!to) throw new Error(`No decay product for ${f.id}`);
	const product = fighter(to);
	const hp = Math.max(1, Math.round((f.hp / f.maxHp) * product.maxHp));
	s.sides[side].team[s.sides[side].active] = { ...product, hp, surge: f.surge };
	events.push({ type: 'decay', side, from: f.id, to });
}

/**
 * Handles faints: a fainted active particle is replaced by the next one standing.
 * Returns true when the battle is over.
 */
function settle(s: BattleState, events: BattleEvent[]): boolean {
	// A fainted active particle is swapped out below, so each faint is reported once.
	for (const side of [0, 1] as const) {
		const f = activeOf(s, side);
		if (!alive(f)) events.push({ type: 'faint', side, fighter: f.id });
	}
	const out = ([0, 1] as const).filter((side) => !s.sides[side].team.some(alive));
	if (out.length) {
		s.winner = out.length === 2 ? 'draw' : other(out[0]);
		events.push({ type: 'end', winner: s.winner, reason: 'knockout' });
		return true;
	}
	for (const side of [0, 1] as const) {
		if (alive(activeOf(s, side))) continue;
		const from = activeOf(s, side).id;
		s.sides[side].active = s.sides[side].team.findIndex(alive);
		events.push({ type: 'switch', side, from, to: activeOf(s, side).id });
	}
	return false;
}
