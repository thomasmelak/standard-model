<script lang="ts">
	import Equation from './Equation.svelte';
	import Orb from './Orb.svelte';
	import OrbCanvas from './OrbCanvas.svelte';
	import ParticleSymbol from './ParticleSymbol.svelte';
	import {
		bindingEnergyMeV,
		dexNumber,
		formatFraction,
		formatMass,
		formatSpin,
		getParticle,
		particleEvolution,
		particleInteractions,
		particleMoves,
		particleStats,
		particleTypes,
		type Force,
		type Particle
	} from '#lib/physics/index.ts';

	interface Props {
		particle: Particle;
		/** Called when the reader picks a related particle on the card. */
		onselect?: (id: string) => void;
	}

	let { particle, onselect }: Props = $props();

	const types = $derived(particleTypes(particle));
	const stats = $derived(particleStats(particle));
	const total = $derived(stats.reduce((sum, s) => sum + s.value, 0));
	const interactions = $derived(particleInteractions(particle));
	const moves = $derived(particleMoves(particle));
	const evolution = $derived(particleEvolution(particle));
	const leptonNumber = $derived(particle.leptonE + particle.leptonMu + particle.leptonTau);

	const forceNames: Record<Force, string> = {
		strong: 'Strong',
		electromagnetic: 'Electric',
		weak: 'Weak',
		higgs: 'Higgs'
	};
</script>

{#snippet chip(id: string)}
	{@const p = getParticle(id)}
	<button type="button" class="chip" title={p.name} onclick={() => onselect?.(id)}>
		<Orb particle={p} size={16} />
		<span><ParticleSymbol symbol={p.symbol} /></span>
	</button>
{/snippet}

{#snippet badge(force: Force)}
	<span class="badge" style:--f={`var(--${force})`}>{forceNames[force]}</span>
{/snippet}

<article class="card" style:--c={`var(--${particle.category})`}>
	<header>
		<div>
			<span class="dex">{dexNumber(particle)}</span>
			<h2>{particle.name}</h2>
		</div>
		<div class="types">
			{#each types as force (force)}
				{@render badge(force)}
			{/each}
		</div>
	</header>

	<div class="art" style:--glow={`var(--${particle.category})`}>
		<OrbCanvas {particle} size={190} />
		<span class="art-symbol"><ParticleSymbol symbol={particle.symbol} /></span>
	</div>

	<p class="tagline">
		<span class="kind">{particle.category.replace('-', ' ')}</span>
		{#if particle.elementary && particle.generation}· Generation {particle.generation}{/if}
		· Spin {formatSpin(particle.spin)} · Charge {formatFraction(particle.charge3, 3)}
	</p>
	<p>{particle.description}</p>

	<section>
		<h3>Stats</h3>
		<dl class="stats">
			{#each stats as s (s.key)}
				<dt title={s.meaning}>{s.label}</dt>
				<dd title={s.meaning}>
					<span class="bar"><span style:width={`${s.value}%`}></span></span>
					<span class="value">{s.value}</span>
					<span class="meaning">{s.meaning}</span>
				</dd>
			{/each}
			<dt>Total</dt>
			<dd><strong>{total}</strong></dd>
		</dl>
	</section>

	<section>
		<h3>Interacts with</h3>
		{#each interactions as i (i.force)}
			<div class="interaction">
				<div class="via">
					{@render badge(i.force)}
					<span class="muted"
						>via {i.carriers
							.map((id) => (id === 'W+' ? 'W±' : getParticle(id).symbol))
							.join(', ')}</span
					>
				</div>
				<div class="chips">
					{#each i.partners as id (id)}
						{@render chip(id)}
					{/each}
				</div>
			</div>
		{:else}
			<p class="muted">Nothing — it is bound up inside the composites it forms.</p>
		{/each}
	</section>

	{#if moves.length}
		<section>
			<h3>Moves</h3>
			<ul class="moves">
				{#each moves as move (move.id)}
					<li>
						<div class="move-head">
							<strong>{move.name}</strong>
							{@render badge(move.force)}
						</div>
						<Equation inputs={move.inputs} outputs={move.outputs} />
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if evolution.from || evolution.into.length}
		<section>
			<h3>Evolution</h3>
			{#if evolution.from}
				<div class="evo">
					<span class="muted">Made from</span>
					<div class="chips">
						{#each evolution.from as id, i (i)}
							{@render chip(id)}
						{/each}
					</div>
				</div>
			{/if}
			{#if evolution.into.length}
				<div class="evo">
					<span class="muted">Fuses into</span>
					<div class="chips">
						{#each evolution.into as c (c.id)}
							{@render chip(c.id)}
						{/each}
					</div>
				</div>
			{/if}
		</section>
	{/if}

	<details>
		<summary>Field data</summary>
		<dl class="data">
			<dt>Mass</dt>
			<dd>{formatMass(particle.massMeV)}</dd>
			<dt>Baryon number</dt>
			<dd>{formatFraction(particle.baryon3, 3)}</dd>
			<dt>Lepton number</dt>
			<dd>{formatFraction(leptonNumber)}</dd>
			{#if !particle.elementary}
				<dt>Held by</dt>
				<dd>{particle.boundBy} force</dd>
				<dt>Binding energy</dt>
				<dd>{bindingEnergyMeV(particle).toFixed(3)} MeV</dd>
			{/if}
		</dl>
	</details>
</article>

<style>
	.card {
		display: grid;
		gap: 0.75rem;
		padding: 1rem;
		border: 3px solid var(--c);
		border-radius: 18px;
		background: linear-gradient(
			160deg,
			color-mix(in srgb, var(--c) 18%, var(--surface)),
			var(--surface) 45%
		);
		box-shadow: 0 8px 28px color-mix(in srgb, var(--c) 20%, transparent);
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.dex {
		font-size: 0.8rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}

	h2 {
		margin: 0;
		text-transform: capitalize;
	}

	h3 {
		margin: 0 0 0.4rem;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}

	p {
		margin: 0;
	}

	.types {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.3rem;
	}

	.badge {
		padding: 0.05rem 0.55rem;
		border-radius: 999px;
		background: var(--f);
		/* Force colours are dark in the light theme and light in the dark theme. */
		color: var(--bg);
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		white-space: nowrap;
	}

	/* The art window stays dark in both themes so the orb's glow reads. */
	.art {
		position: relative;
		display: grid;
		place-items: center;
		border-radius: 12px;
		background: radial-gradient(
			circle at 50% 45%,
			color-mix(in srgb, var(--glow) 22%, #0b0f17),
			#05070b 75%
		);
		border: 1px solid color-mix(in srgb, var(--glow) 40%, transparent);
	}

	.art-symbol {
		position: absolute;
		right: 0.75rem;
		bottom: 0.4rem;
		font-size: 1.4rem;
		font-weight: 700;
		color: white;
		opacity: 0.85;
	}

	.tagline {
		font-size: 0.85rem;
		color: var(--muted);
	}

	.kind {
		text-transform: capitalize;
	}

	section {
		border-top: 1px solid var(--border);
		padding-top: 0.6rem;
	}

	.stats {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25rem 0.75rem;
		margin: 0;
		align-items: center;
	}

	.stats dt {
		align-self: start;
		font-weight: 600;
		font-size: 0.85rem;
		line-height: 1;
	}

	.stats dd {
		display: grid;
		grid-template-columns: 1fr 2.2rem;
		align-items: center;
		gap: 0 0.5rem;
		margin: 0;
	}

	.bar {
		height: 0.55rem;
		border-radius: 999px;
		background: var(--surface-2);
		overflow: hidden;
	}

	.bar span {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, color-mix(in srgb, var(--c) 60%, white), var(--c));
	}

	.value {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-size: 0.85rem;
	}

	.meaning {
		grid-column: 1 / -1;
		font-size: 0.72rem;
		color: var(--muted);
	}

	.interaction,
	.evo {
		display: grid;
		gap: 0.3rem;
		margin-bottom: 0.5rem;
	}

	.via {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.1rem 0.5rem 0.1rem 0.2rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface-2);
		font-size: 0.85rem;
	}

	.chip:hover {
		border-color: var(--accent);
	}

	.moves {
		display: grid;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.move-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	details summary {
		cursor: pointer;
		color: var(--muted);
		font-size: 0.85rem;
	}

	.data {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.2rem 1rem;
		margin: 0.5rem 0 0;
		font-size: 0.9rem;
	}

	.data dt {
		color: var(--muted);
	}

	.data dd {
		margin: 0;
	}
</style>
