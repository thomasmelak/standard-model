<script lang="ts">
	import Equation from './Equation.svelte';
	import EvolutionList from './EvolutionList.svelte';
	import InteractionList from './InteractionList.svelte';
	import ParticleStage from './ParticleStage.svelte';
	import ParticleSymbol from './ParticleSymbol.svelte';
	import ParticleViewer from './ParticleViewer.svelte';
	import StatBars from './StatBars.svelte';
	import TypeBadge from './TypeBadge.svelte';
	import ViewModeToggle, { type ViewMode } from './ViewModeToggle.svelte';
	import { Button, GlassCard, SectionLabel } from '#lib/ui/index.ts';
	import {
		bindingEnergyMeV,
		dexNumber,
		formatFraction,
		formatMass,
		formatSpin,
		particleEvolution,
		particleMoves,
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
	const moves = $derived(particleMoves(particle));
	const evolution = $derived(particleEvolution(particle));
	const leptonNumber = $derived(particle.leptonE + particle.leptonMu + particle.leptonTau);

	let mode = $state<ViewMode>('orb');
	let fullscreen = $state(false);
</script>

{#snippet badge(force: Force)}
	<TypeBadge {force} />
{/snippet}

<GlassCard
	as="article"
	glow={`var(--${particle.category})`}
	shine
	style={`--c: var(--${particle.category});`}
>
	<div class="card">
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

		<div class="art on-dark" style:--glow={`var(--${particle.category})`}>
			<ParticleStage {particle} size={190} {mode} {onselect} />
			<span class="art-symbol"><ParticleSymbol symbol={particle.symbol} /></span>
			<span class="art-tools">
				<ViewModeToggle {particle} bind:mode />
				<span class="expand">
					<Button
						icon
						title="Full screen"
						aria-label="Show {particle.name} full screen"
						onclick={() => (fullscreen = true)}>⤢</Button
					>
				</span>
			</span>
		</div>

		<ParticleViewer {particle} bind:open={fullscreen} bind:mode {onselect} />

		<p class="tagline">
			<span class="kind">{particle.category.replace('-', ' ')}</span>
			{#if particle.elementary && particle.generation}· Generation {particle.generation}{/if}
			· Spin {formatSpin(particle.spin)} · Charge {formatFraction(particle.charge3, 3)}
		</p>
		<p>{particle.description}</p>

		<section>
			<SectionLabel>Stats</SectionLabel>
			<StatBars {particle} />
		</section>

		<section>
			<SectionLabel>Interacts with</SectionLabel>
			<InteractionList {particle} {onselect} />
		</section>

		{#if moves.length}
			<section>
				<SectionLabel>Moves</SectionLabel>
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
				<SectionLabel>Evolution</SectionLabel>
				<EvolutionList {particle} {onselect} />
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
	</div>
</GlassCard>

<style>
	.card {
		display: grid;
		gap: var(--space-3);
	}

	/* Name first; the type badges move under it when there isn't room beside it. */
	header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.dex {
		font-size: 0.8rem;
		color: var(--muted);
		font-family: var(--font-mono);
	}

	/* Orbitron runs wide: shrink on narrow phones so "electron antineutrino" stays on one line. */
	h2 {
		margin: 0;
		font-size: clamp(1.1rem, 5vw, 1.5rem);
		text-transform: capitalize;
		white-space: nowrap;
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

	/* The art window stays dark in both themes so the orb's glow reads. */
	.art {
		position: relative;
		display: grid;
		place-items: center;
		border-radius: var(--radius-md);
		background: radial-gradient(
			circle at 50% 45%,
			color-mix(in srgb, var(--glow) 22%, #0b0f17),
			#05070b 75%
		);
		border: 1px solid color-mix(in srgb, var(--glow) 40%, transparent);
	}

	.art-tools {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		right: 0.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.expand {
		margin-left: auto;
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
		border-top: 1px solid var(--glass-line);
		padding-top: 0.6rem;
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
