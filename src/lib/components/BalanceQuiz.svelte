<script lang="ts">
	import Orb from './Orb.svelte';
	import ParticleSymbol from './ParticleSymbol.svelte';
	import TypeBadge from './TypeBadge.svelte';
	import { Button, GlassCard } from '#lib/ui/index.ts';
	import { game } from '#lib/game/store.svelte.ts';
	import { BALANCE_QUESTIONS, checkPick } from '#lib/game/balance.ts';
	import { formatFraction, getParticle, type ConservationCheck } from '#lib/physics/index.ts';

	// Balance the reaction: one product is hidden; pick the particle that keeps
	// every conservation law. A wrong pick shows exactly which law it breaks.

	let index = $state(
		Math.max(
			0,
			BALANCE_QUESTIONS.findIndex((q) => !game.collection.balanced.includes(q.id))
		)
	);
	const q = $derived(BALANCE_QUESTIONS[index]);
	let wrong = $state<string[]>([]);
	let broken = $state<ConservationCheck[]>([]);
	let right = $state(false);

	const done = $derived(game.collection.balanced.length);

	function pick(id: string) {
		const checks = checkPick(q, id);
		if (checks.every((c) => c.conserved)) {
			right = true;
			broken = [];
			game.balance(q.id);
		} else {
			wrong = [...wrong, id];
			broken = checks.filter((c) => !c.conserved);
		}
	}

	function go(to: number) {
		index = (to + BALANCE_QUESTIONS.length) % BALANCE_QUESTIONS.length;
		wrong = [];
		broken = [];
		right = false;
	}

	const signed = (n: number, scale: number) => (n > 0 ? '+' : '') + formatFraction(n, scale);
</script>

<p class="count muted">
	Question {index + 1} of {BALANCE_QUESTIONS.length} · {done} balanced
</p>

<GlassCard as="section" glow={`var(--${q.reaction.force})`} shine>
	<header class="head">
		<h2>{q.reaction.name}</h2>
		<TypeBadge force={q.reaction.force} />
	</header>

	<p class="equation" aria-label="Reaction with one product missing">
		{#each q.reaction.inputs as id, i (i)}
			{#if i > 0}&nbsp;+&nbsp;{/if}<ParticleSymbol symbol={getParticle(id).symbol} />
		{/each}
		→
		{#each q.reaction.outputs as id, i (i)}
			{#if i > 0}&nbsp;+&nbsp;{/if}
			{#if i === q.index}
				<span class="slot" class:filled={right}>
					{#if right}<ParticleSymbol symbol={getParticle(id).symbol} />{:else}?{/if}
				</span>
			{:else}
				<ParticleSymbol symbol={getParticle(id).symbol} />
			{/if}
		{/each}
	</p>

	<div class="options" role="group" aria-label="Choices">
		{#each q.options as id (id)}
			{@const p = getParticle(id)}
			<button
				type="button"
				class="option"
				class:bad={wrong.includes(id)}
				class:good={right && id === q.answer}
				disabled={right || wrong.includes(id)}
				onclick={() => pick(id)}
				style:--c={`var(--${p.category})`}
			>
				<Orb particle={p} size={34} />
				<span class="symbol"><ParticleSymbol symbol={p.symbol} /></span>
				<span class="name">{p.name}</span>
			</button>
		{/each}
	</div>

	{#if right}
		<p class="result good" role="status">
			<strong>Balanced!</strong>
			{q.reaction.description}
		</p>
	{:else if broken.length}
		<div class="result bad" role="status">
			<strong>Not conserved:</strong>
			<ul>
				{#each broken as c (c.label)}
					<li>
						{c.label}: {signed(c.before, c.scale)} before, {signed(c.after, c.scale)} after
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<div class="nav">
		<Button variant="ghost" onclick={() => go(index - 1)}>‹ Previous</Button>
		<Button variant={right ? 'primary' : 'secondary'} onclick={() => go(index + 1)}>Next ›</Button>
	</div>
</GlassCard>

<style>
	.count {
		margin: 0 0 var(--space-2);
		font-family: var(--font-mono);
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.head h2 {
		margin: 0;
		font-size: 1.2rem;
	}

	.equation {
		margin: var(--space-4) 0;
		font-size: 1.6rem;
		text-align: center;
	}

	.slot {
		display: inline-grid;
		place-items: center;
		min-width: 2.4rem;
		padding: 0 0.3rem;
		border: 2px dashed var(--accent);
		border-radius: var(--radius-sm);
		color: var(--accent);
	}

	.slot.filled {
		border-style: solid;
		border-color: var(--ok);
		color: var(--text);
	}

	.options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
		gap: var(--space-2);
	}

	.option {
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-areas: 'orb symbol' 'orb name';
		align-items: center;
		column-gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		border: 2px solid color-mix(in srgb, var(--c) 45%, transparent);
		border-radius: var(--radius-md);
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--c) 14%, var(--glass-tint)),
			var(--glass-tint-2)
		);
		text-align: left;
	}

	.option > :global(.orb) {
		grid-area: orb;
	}

	.option:hover:not(:disabled),
	.option:focus-visible {
		border-color: var(--c);
	}

	.option.bad {
		border-color: var(--bad);
		opacity: 0.5;
		cursor: not-allowed;
	}

	.option.good {
		border-color: var(--ok);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--ok) 35%, transparent);
	}

	.symbol {
		grid-area: symbol;
		font-weight: 700;
		font-size: 1.1rem;
	}

	.name {
		grid-area: name;
		font-size: 0.75rem;
		color: var(--muted);
		text-transform: capitalize;
	}

	.result {
		margin: var(--space-3) 0 0;
		padding: var(--space-2) var(--space-3);
		border-left: 3px solid var(--ok);
		font-size: 0.9rem;
	}

	.result.bad {
		border-color: var(--bad);
	}

	.result ul {
		margin: var(--space-1) 0 0;
		padding-left: 1.2rem;
	}

	.nav {
		display: flex;
		justify-content: space-between;
		margin-top: var(--space-4);
	}
</style>
