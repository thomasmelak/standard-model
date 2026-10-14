import {
	activeOf,
	legalActions,
	other,
	type Action,
	type BattleState,
	type SideId
} from './engine';
import { SURGE_POWER, baseDamage, movesFor } from './rules';

// The rival: greedy and deterministic. It hits as hard as it can, switches when
// it can't hurt the opponent at all, and annihilates when that trade favours it.

export function chooseAction(s: BattleState, side: SideId): Action {
	const me = activeOf(s, side);
	const foe = activeOf(s, other(side));
	const legal = legalActions(s, side);
	const surge = me.surge > 0 ? SURGE_POWER : 0;
	const moves = movesFor(me.id, foe.id);

	if (moves.includes('annihilate') && me.hp / me.maxHp < foe.hp / foe.maxHp) {
		return { type: 'move', move: 'annihilate' };
	}

	const best = moves
		.map((move) => ({ move, damage: baseDamage(move, me.id, foe.id, surge) }))
		.sort((a, b) => b.damage - a.damage)[0];
	if (best && best.damage > 0) {
		// Power up first when the surge would pay for itself within its three turns.
		if (moves.includes('higgs') && !me.surge && foe.hp > best.damage * 2) {
			const boosted = baseDamage(best.move, me.id, foe.id, SURGE_POWER);
			if ((boosted - best.damage) * 2 > best.damage) return { type: 'move', move: 'higgs' };
		}
		return { type: 'move', move: best.move };
	}

	// Nothing works: bring in whoever hits hardest, if anyone can.
	const bench = legal
		.filter((a): a is Extract<Action, { type: 'switch' }> => a.type === 'switch')
		.map((a) => {
			const id = s.sides[side].team[a.to].id;
			const damage = Math.max(0, ...movesFor(id, foe.id).map((m) => baseDamage(m, id, foe.id)));
			return { a, damage };
		})
		.sort((x, y) => y.damage - x.damage)[0];
	if (bench && bench.damage > 0) return bench.a;

	if (moves.includes('higgs') && !me.surge) return { type: 'move', move: 'higgs' };
	// No useful move at all: still act, so the turn passes.
	return moves.length ? { type: 'move', move: moves[0] } : legal[0];
}
