<script lang="ts">
	import Orb from './Orb.svelte';
	import ParticleSymbol from './ParticleSymbol.svelte';
	import { hint } from '#lib/game/collection.ts';
	import { formatFraction, formatMass, type Particle } from '#lib/physics/index.ts';

	interface Props {
		particle: Particle;
		selected?: boolean;
		compact?: boolean;
		/** Overrides the symbol shown, e.g. "W±" for the combined W tile. */
		label?: string;
		onclick?: () => void;
		/** Not discovered yet: shown as a silhouette with a hint, and can't be picked. */
		locked?: boolean;
	}

	let {
		particle,
		selected = false,
		compact = false,
		label,
		onclick,
		locked = false
	}: Props = $props();
</script>

<button
	type="button"
	class="tile"
	class:selected
	class:compact
	class:locked
	style:--tile-color={`var(--${particle.category})`}
	title={locked ? `Undiscovered. ${hint(particle)}` : particle.name}
	aria-label={locked ? 'Undiscovered particle' : undefined}
	disabled={locked}
	{onclick}
>
	{#if locked}
		<span class="art"><span class="silhouette">?</span></span>
		{#if !compact}
			<span class="name">???</span>
		{/if}
	{:else}
		<span class="charge">{formatFraction(particle.charge3, 3)}</span>
		<span class="art">
			<Orb {particle} size={compact ? 34 : 50} />
			<span class="symbol"><ParticleSymbol symbol={label ?? particle.symbol} /></span>
		</span>
		{#if !compact}
			<span class="name">{particle.name}</span>
			<span class="mass">{formatMass(particle.massMeV)}</span>
		{/if}
	{/if}
</button>

<style>
	.tile {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 6.5rem;
		padding: 0.5rem 0.25rem;
		border: 2px solid color-mix(in srgb, var(--tile-color) 55%, transparent);
		border-radius: var(--radius-md);
		/* Glass tinted with the particle's colour, like a GlassCard with a glow. */
		background:
			radial-gradient(120% 70% at 0% 0%, var(--glass-reflection), transparent 55%),
			linear-gradient(
				135deg,
				color-mix(in srgb, var(--tile-color) 16%, var(--glass-tint)),
				color-mix(in srgb, var(--tile-color) 8%, var(--glass-tint-2))
			);
		box-shadow: inset 0 1px 0 var(--glass-edge);
		transition:
			transform 0.1s,
			border-color 0.1s;
	}

	.tile:hover {
		transform: translateY(-2px);
		border-color: var(--tile-color);
	}

	.tile.locked {
		border-style: dashed;
		border-color: var(--border);
		background: var(--surface-2);
		cursor: not-allowed;
	}

	.tile.locked:hover {
		transform: none;
	}

	/* An undiscovered particle: a dark, featureless sphere. */
	.silhouette {
		display: grid;
		place-items: center;
		width: 70%;
		height: 70%;
		border-radius: 50%;
		background: radial-gradient(circle at 40% 35%, #3a3f48, #12151a 75%);
		color: rgb(255 255 255 / 0.5);
		font-weight: 700;
	}

	.tile.selected {
		border-color: var(--tile-color);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--tile-color) 35%, transparent);
	}

	.tile.compact {
		min-height: 3.5rem;
		min-width: 3.5rem;
		/* Keep the symbol clear of the charge label in the corner. */
		padding-top: 1rem;
	}

	.charge {
		position: absolute;
		top: 0.25rem;
		left: 0.4rem;
		font-size: 0.7rem;
		color: var(--muted);
	}

	/* The symbol sits on the orb, like a label on a glowing marble. */
	.art {
		display: grid;
		place-items: center;
		width: 56px;
		height: 56px;
		margin-bottom: 0.15rem;
	}

	.compact .art {
		width: 36px;
		height: 36px;
		margin: 0;
	}

	.art > :global(*) {
		grid-area: 1 / 1;
	}

	.symbol {
		position: relative;
		font-size: 1.15rem;
		font-weight: 700;
		color: white;
		text-shadow:
			0 0 4px rgb(0 0 0 / 0.8),
			0 1px 2px rgb(0 0 0 / 0.9);
	}

	.compact .symbol {
		font-size: 0.9rem;
	}

	.name {
		font-size: 0.75rem;
		text-align: center;
	}

	.mass {
		font-size: 0.65rem;
		color: var(--muted);
	}
</style>
