<script lang="ts">
	import Orb from './Orb.svelte';
	import ParticleSymbol from './ParticleSymbol.svelte';
	import {
		elementaryConstituents,
		getParticle,
		type CompositeParticle
	} from '#lib/physics/index.ts';

	// A composite's parts laid out on a ring: either its direct constituents
	// (a helium atom → ⁴He nucleus + 2 electrons) or everything down to quarks
	// and leptons (→ 6 up quarks, 6 down quarks, 2 electrons).

	interface Props {
		particle: CompositeParticle;
		depth: 'parts' | 'fundamental';
		/** Side of the square the ring fits in, in pixels. */
		size: number;
		onselect?: (id: string) => void;
	}

	let { particle, depth, size, onselect }: Props = $props();

	const ids = $derived(
		depth === 'parts' ? particle.constituents : elementaryConstituents(particle)
	);
	// Fewer parts get bigger orbs; the ring shrinks to keep them inside the frame.
	const orb = $derived(Math.min(size * 0.32, (size * 2.2) / (ids.length + 2)));
	const ring = $derived(ids.length === 1 ? 0 : (size - orb * 1.6) / 2);
	const labelSize = $derived(Math.max(11, orb * 0.3));
</script>

<ul
	class="parts"
	style:--size={`${size}px`}
	style:--ring={`${ring * 2}px`}
	aria-label="Constituents of {particle.name}"
>
	{#each ids as id, i (i)}
		{@const p = getParticle(id)}
		{@const angle = (i / ids.length) * Math.PI * 2 - Math.PI / 2}
		<li
			class="part"
			style:left={`${size / 2 + Math.cos(angle) * ring}px`}
			style:top={`${size / 2 + Math.sin(angle) * ring}px`}
			style:--label={`${labelSize}px`}
		>
			<button type="button" title={p.name} onclick={() => onselect?.(id)}>
				<Orb particle={p} size={orb} />
				<span class="symbol"><ParticleSymbol symbol={p.symbol} /></span>
			</button>
		</li>
	{/each}
</ul>

<style>
	.parts {
		position: relative;
		margin: 0;
		padding: 0;
		list-style: none;
		width: var(--size);
		height: var(--size);
	}

	/* The binding that holds the parts together, drawn as a faint ring. */
	.parts::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: var(--ring);
		height: var(--ring);
		border-radius: 50%;
		border: 1px dashed rgb(255 255 255 / 0.25);
		transform: translate(-50%, -50%);
	}

	.part {
		position: absolute;
		transform: translate(-50%, -50%);
	}

	button {
		display: grid;
		place-items: center;
		padding: 0;
		border: none;
		background: none;
		transition: transform 0.15s;
	}

	button:hover,
	button:focus-visible {
		transform: scale(1.12);
	}

	button > :global(*) {
		grid-area: 1 / 1;
	}

	.symbol {
		position: relative;
		font-size: var(--label);
		font-weight: 700;
		color: white;
		text-shadow:
			0 0 4px rgb(0 0 0 / 0.9),
			0 1px 2px rgb(0 0 0 / 0.9);
	}
</style>
