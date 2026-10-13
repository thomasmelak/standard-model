import {
	allParticles,
	checkConservation,
	getParticle,
	reactions,
	type ConservationCheck,
	type Reaction
} from '#lib/physics/index.ts';

// "Balance the reaction": a real process with one product hidden. The player
// picks the particle that keeps every conservation law; the lab's
// conservation checker is the referee.

export interface BalanceQuestion {
	id: string;
	reaction: Reaction;
	/** Which output is hidden. */
	index: number;
	answer: string;
	/** Four choices, in a fixed shuffled order. */
	options: string[];
}

/** The reaction's outputs with the hidden one replaced. */
export function withPick(q: BalanceQuestion, pick: string): string[] {
	return q.reaction.outputs.map((id, i) => (i === q.index ? pick : id));
}

export function checkPick(q: BalanceQuestion, pick: string): ConservationCheck[] {
	return checkConservation(q.reaction.inputs, withPick(q, pick));
}

const conserves = (q: Omit<BalanceQuestion, 'options'>, pick: string) =>
	checkConservation(q.reaction.inputs, withPick({ ...q, options: [] }, pick)).every(
		(c) => c.conserved
	);

/** A small stable hash, so option order is fixed per question but not always answer-first. */
function hash(text: string): number {
	let h = 7;
	for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
	return h;
}

/**
 * Three wrong choices that each break a conservation law, nearest first: the
 * answer's antiparticle, then particles of the same kind, then anything else.
 */
function distractors(q: Omit<BalanceQuestion, 'options'>): string[] {
	const answer = getParticle(q.answer);
	const anti = answer.elementary ? answer.antiparticleId : undefined;
	const wrong = allParticles.filter((p) => p.id !== q.answer && !conserves(q, p.id));
	const rank = (id: string) =>
		id === anti ? 0 : getParticle(id).category === answer.category ? 1 : 2;
	return wrong
		.map((p) => p.id)
		.sort((a, b) => rank(a) - rank(b))
		.slice(0, 3);
}

function build(reaction: Reaction, index: number): BalanceQuestion {
	const base = { id: `${reaction.id}:${index}`, reaction, index, answer: reaction.outputs[index] };
	const options = [base.answer, ...distractors(base)];
	const turn = hash(base.id) % options.length;
	return { ...base, options: [...options.slice(turn), ...options.slice(0, turn)] };
}

/** One question per distinct product of every reaction. */
export const BALANCE_QUESTIONS: BalanceQuestion[] = reactions.flatMap((r) =>
	r.outputs.flatMap((id, i) => (r.outputs.indexOf(id) === i ? [build(r, i)] : []))
);
