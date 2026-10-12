<script lang="ts">
	import ParticleSymbol from './ParticleSymbol.svelte';
	import {
		bindingEnergyMeV,
		formatFraction,
		formatMass,
		formatSpin,
		getParticle,
		type Particle
	} from '#lib/physics/index.ts';

	let { particle }: { particle: Particle } = $props();

	const leptonNumber = $derived(particle.leptonE + particle.leptonMu + particle.leptonTau);
</script>

<article class="panel" style:--c={`var(--${particle.category})`}>
	<header>
		<span class="symbol"><ParticleSymbol symbol={particle.symbol} /></span>
		<div>
			<h2>{particle.name}</h2>
			<span class="category">{particle.category.replace('-', ' ')}</span>
		</div>
	</header>

	<p>{particle.description}</p>

	<dl>
		<dt>Mass</dt>
		<dd>{formatMass(particle.massMeV)}</dd>
		<dt>Charge</dt>
		<dd>{formatFraction(particle.charge3, 3)} e</dd>
		<dt>Spin</dt>
		<dd>{formatSpin(particle.spin)}</dd>
		<dt>Baryon number</dt>
		<dd>{formatFraction(particle.baryon3, 3)}</dd>
		<dt>Lepton number</dt>
		<dd>{formatFraction(leptonNumber)}</dd>
		{#if particle.elementary}
			{#if particle.generation}
				<dt>Generation</dt>
				<dd>{particle.generation}</dd>
			{/if}
			{#if particle.mediates}
				<dt>Carries</dt>
				<dd>
					<span class="force" style:--f={`var(--${particle.mediates})`}>{particle.mediates}</span>
				</dd>
			{/if}
			<dt>Feels</dt>
			<dd>
				{#each particle.forces as force (force)}
					<span class="force" style:--f={`var(--${force})`}>{force}</span>
				{:else}
					<span class="muted">nothing directly</span>
				{/each}
			</dd>
		{:else}
			<dt>Made of</dt>
			<dd>
				{#each particle.constituents as id, i (i)}
					{#if i > 0}&nbsp;+
					{/if}<ParticleSymbol symbol={getParticle(id).symbol} />
				{/each}
			</dd>
			<dt>Held by</dt>
			<dd>
				<span class="force" style:--f={`var(--${particle.boundBy})`}>{particle.boundBy}</span>
			</dd>
			<dt>Binding energy</dt>
			<dd>{bindingEnergyMeV(particle).toFixed(3)} MeV</dd>
		{/if}
	</dl>
</article>

<style>
	article {
		border-top: 4px solid var(--c);
	}

	header {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.symbol {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--c);
		min-width: 3rem;
		text-align: center;
	}

	h2 {
		margin: 0;
		text-transform: capitalize;
	}

	.category {
		color: var(--muted);
		text-transform: capitalize;
		font-size: 0.85rem;
	}

	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.3rem 1rem;
		margin: 0;
	}

	dt {
		color: var(--muted);
	}

	dd {
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.force {
		padding: 0 0.5rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--f) 25%, transparent);
		border: 1px solid var(--f);
		font-size: 0.8rem;
	}
</style>
