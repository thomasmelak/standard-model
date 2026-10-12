<script lang="ts">
	import ParticleSymbol from './ParticleSymbol.svelte';
	import { formatFraction, formatMass, type Particle } from '#lib/physics/index.ts';

	interface Props {
		particle: Particle;
		selected?: boolean;
		compact?: boolean;
		/** Overrides the symbol shown, e.g. "W±" for the combined W tile. */
		label?: string;
		onclick?: () => void;
	}

	let { particle, selected = false, compact = false, label, onclick }: Props = $props();
</script>

<button
	type="button"
	class="tile"
	class:selected
	class:compact
	style:--tile-color={`var(--${particle.category})`}
	title={particle.name}
	{onclick}
>
	<span class="charge">{formatFraction(particle.charge3, 3)}</span>
	<span class="symbol"><ParticleSymbol symbol={label ?? particle.symbol} /></span>
	{#if !compact}
		<span class="name">{particle.name}</span>
		<span class="mass">{formatMass(particle.massMeV)}</span>
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
		border-radius: 10px;
		background: color-mix(in srgb, var(--tile-color) 14%, var(--surface));
		transition:
			transform 0.1s,
			border-color 0.1s;
	}

	.tile:hover {
		transform: translateY(-2px);
		border-color: var(--tile-color);
	}

	.tile.selected {
		border-color: var(--tile-color);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--tile-color) 35%, transparent);
	}

	.tile.compact {
		min-height: 3.5rem;
		min-width: 3.5rem;
	}

	.charge {
		position: absolute;
		top: 0.25rem;
		left: 0.4rem;
		font-size: 0.7rem;
		color: var(--muted);
	}

	.symbol {
		font-size: 1.6rem;
		font-weight: 600;
	}

	.compact .symbol {
		font-size: 1.2rem;
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
