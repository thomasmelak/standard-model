<script lang="ts">
	import ParticleTile from './ParticleTile.svelte';
	import { Button, GlassCard } from '#lib/ui/index.ts';
	import { game } from '#lib/game/store.svelte.ts';
	import {
		PUZZLES,
		act,
		isSolved,
		startPuzzle,
		stars,
		type PuzzleAction
	} from '#lib/game/puzzles.ts';
	import { getParticle } from '#lib/physics/index.ts';

	// Puzzles: pick particles in the tray, then combine, split or react them
	// until the target appears. Only successful actions count as moves.

	let puzzleId = $state(
		PUZZLES.find((p) => !(p.id in game.collection.puzzles))?.id ?? PUZZLES[0].id
	);
	const puzzle = $derived(PUZZLES.find((p) => p.id === puzzleId) ?? PUZZLES[0]);
	const target = $derived(getParticle(puzzle.target));

	// svelte-ignore state_referenced_locally
	let play = $state(startPuzzle(puzzle));
	let selected = $state<number[]>([]);
	let message = $state<{ text: string; ok: boolean } | undefined>();
	let showHint = $state(false);

	const solved = $derived(isSolved(play, puzzle));
	const best = $derived(game.collection.puzzles[puzzle.id]);
	const selectedIds = $derived(selected.map((k) => play.tokens.find((t) => t.key === k)?.id ?? ''));
	const canSplit = $derived(selectedIds.length === 1 && !getParticle(selectedIds[0]).elementary);

	function open(id: string) {
		puzzleId = id;
		restart();
	}

	function restart() {
		play = startPuzzle(puzzle);
		selected = [];
		message = undefined;
		showHint = false;
	}

	function toggle(key: number) {
		if (solved) return;
		selected = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key];
	}

	function run(action: PuzzleAction) {
		const outcome = act(play, action);
		message = { text: outcome.message, ok: outcome.ok };
		if (!outcome.ok) return;
		play = outcome.state;
		selected = [];
		game.discover(outcome.made, outcome.reactionId);
		if (isSolved(play, puzzle)) game.solvePuzzle(puzzle.id, play.moves);
	}

	const index = $derived(PUZZLES.indexOf(puzzle));
	const next = $derived(PUZZLES[index + 1]);
	const starText = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n);
</script>

<nav class="levels" aria-label="Puzzles">
	{#each PUZZLES as p, i (p.id)}
		{@const score = game.collection.puzzles[p.id]}
		<Button
			size="sm"
			variant={p.id === puzzle.id ? 'primary' : 'secondary'}
			aria-current={p.id === puzzle.id ? 'true' : undefined}
			title={p.title}
			onclick={() => open(p.id)}
		>
			{i + 1}
			<span class="stars" aria-label={score ? `${stars(score, p.par)} stars` : 'not solved'}>
				{score ? starText(stars(score, p.par)) : '·'}
			</span>
		</Button>
	{/each}
</nav>

<GlassCard as="section" glow={`var(--${target.category})`} shine>
	<header class="brief">
		<div>
			<h2>{index + 1}. {puzzle.title}</h2>
			<p class="muted">{puzzle.brief}</p>
		</div>
		<div class="target">
			<span class="muted">Target</span>
			<ParticleTile particle={target} compact />
		</div>
	</header>

	<p class="score">
		Moves <strong>{play.moves}</strong> · Par <strong>{puzzle.par}</strong>
		{#if best}· Best <strong>{best}</strong>{/if}
	</p>

	<div class="tray" role="group" aria-label="Your particles">
		{#each play.tokens as t (t.key)}
			<span class="token">
				<ParticleTile
					particle={getParticle(t.id)}
					compact
					selected={selected.includes(t.key)}
					onclick={() => toggle(t.key)}
				/>
			</span>
		{/each}
	</div>

	{#if solved}
		<div class="solved" role="status">
			<strong>Solved in {play.moves} {play.moves === 1 ? 'move' : 'moves'}!</strong>
			<span class="big-stars" aria-label="{stars(play.moves, puzzle.par)} stars"
				>{starText(stars(play.moves, puzzle.par))}</span
			>
			<div class="actions">
				{#if play.moves > puzzle.par}
					<Button onclick={restart}>Try for par</Button>
				{/if}
				{#if next}
					<Button variant="primary" onclick={() => open(next.id)}>Next puzzle</Button>
				{/if}
			</div>
		</div>
	{:else}
		<div class="actions">
			<Button
				variant="primary"
				disabled={selected.length < 2}
				onclick={() => run({ type: 'combine', keys: selected })}>Combine</Button
			>
			<Button disabled={!canSplit} onclick={() => run({ type: 'split', key: selected[0] })}
				>Split</Button
			>
			<Button disabled={!selected.length} onclick={() => run({ type: 'react', keys: selected })}
				>React</Button
			>
			<Button variant="ghost" onclick={restart}>Restart</Button>
			<Button variant="ghost" onclick={() => (showHint = !showHint)}>Hint</Button>
		</div>
		<p class="help muted">Tap particles to select them, then pick an action.</p>
	{/if}

	{#if message && !solved}
		<p class="message" class:bad={!message.ok} aria-live="polite">{message.text}</p>
	{/if}
	{#if showHint && !solved}
		<p class="hint">💡 {puzzle.hint}</p>
	{/if}
</GlassCard>

<style>
	.levels {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.stars {
		font-size: 0.7rem;
		letter-spacing: -0.05em;
	}

	.brief {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-3);
	}

	.brief h2 {
		margin: 0;
		font-size: 1.2rem;
	}

	.brief p {
		margin: var(--space-1) 0 0;
	}

	.target {
		display: grid;
		justify-items: center;
		gap: var(--space-1);
		font-size: 0.75rem;
	}

	.score {
		margin: var(--space-3) 0;
		font-family: var(--font-mono);
	}

	.tray {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(3.5rem, 1fr));
		gap: var(--space-2);
		min-height: 4rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-top: var(--space-3);
	}

	.help {
		margin: var(--space-2) 0 0;
		font-size: 0.8rem;
	}

	.message {
		margin: var(--space-3) 0 0;
		padding: var(--space-2) var(--space-3);
		border-left: 3px solid var(--ok);
		font-size: 0.9rem;
	}

	.message.bad {
		border-color: var(--bad);
	}

	.hint {
		margin: var(--space-2) 0 0;
		font-size: 0.9rem;
	}

	.solved {
		display: grid;
		justify-items: start;
		gap: var(--space-1);
		margin-top: var(--space-3);
	}

	.big-stars {
		font-size: 1.8rem;
		color: var(--electromagnetic);
		letter-spacing: 0.1em;
	}
</style>
