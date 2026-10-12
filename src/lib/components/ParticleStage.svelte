<script lang="ts">
	import Constituents from './Constituents.svelte';
	import OrbCanvas from './OrbCanvas.svelte';
	import type { ViewMode } from './ViewModeToggle.svelte';
	import type { Particle } from '#lib/physics/index.ts';

	// The particle's art: its live orb, and for composites optionally its parts
	// laid over a dimmed orb. Shared by the card and the full-screen viewer.

	interface Props {
		particle: Particle;
		size: number;
		mode: ViewMode;
		onselect?: (id: string) => void;
	}

	let { particle, size, mode, onselect }: Props = $props();
</script>

<div class="stage" style:--size={`${size}px`}>
	<span class="orb" class:dim={mode !== 'orb' && !particle.elementary}>
		<OrbCanvas {particle} {size} />
	</span>
	{#if mode !== 'orb' && !particle.elementary}
		<span class="overlay">
			<Constituents
				{particle}
				depth={mode === 'parts' ? 'parts' : 'fundamental'}
				size={size * 0.92}
				{onselect}
			/>
		</span>
	{/if}
</div>

<style>
	.stage {
		display: grid;
		place-items: center;
		width: var(--size);
		height: var(--size);
	}

	.stage > * {
		grid-area: 1 / 1;
	}

	.orb {
		transition:
			opacity 0.3s,
			filter 0.3s;
	}

	/* The whole stays visible behind its parts, as a faint glow. */
	.orb.dim {
		opacity: 0.35;
		filter: blur(2px);
	}

	.overlay {
		animation: appear 0.3s ease-out;
	}

	@keyframes appear {
		from {
			opacity: 0;
			transform: scale(0.85);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.overlay {
			animation: none;
		}
	}
</style>
