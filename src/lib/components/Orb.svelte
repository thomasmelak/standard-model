<script lang="ts">
	import { orbParams, parseRgb } from '#lib/orb/params.ts';
	import { orbSnapshot } from '#lib/orb/snapshots.ts';
	import { themeVersion } from '#lib/orb/theme.svelte.ts';
	import { getParticle, type Particle } from '#lib/physics/index.ts';

	// A small orb for tiles and chips: a still frame of the card's shader that
	// slowly turns, under a static glass highlight. Before hydration, or without
	// WebGL, a CSS approximation stands in.

	interface Props {
		particle: Particle;
		/** Diameter in pixels of the heaviest orb; lighter particles render smaller. */
		size?: number;
	}

	let { particle, size = 64 }: Props = $props();

	const params = $derived(orbParams(particle));
	// The shader draws spheres of radius 0.42–0.62; keep the same proportions here.
	const diameter = $derived(Math.round((size * params.radius) / 0.62));
	// Stable particles drift; short-lived ones churn.
	const spin = $derived(`${(40 - 34 * params.turbulence).toFixed(1)}s`);
	const moons = $derived(
		particle.elementary ? [] : particle.constituents.map((id) => getParticle(id).category)
	);

	let root = $state<HTMLSpanElement>();
	let fog = $state<HTMLCanvasElement>();
	let ready = $state(false);

	$effect(() => {
		void themeVersion();
		if (!root || !fog) return;
		// The snapshot covers the shader's whole −1..1 canvas, halo included.
		const px = Math.ceil((size / 0.62) * Math.min(devicePixelRatio, 2));
		const snapshot = orbSnapshot(params, parseRgb(getComputedStyle(root).color), px);
		if (!snapshot) return;
		fog.width = px;
		fog.height = px;
		const ctx = fog.getContext('2d');
		ctx?.clearRect(0, 0, px, px);
		ctx?.drawImage(snapshot, 0, 0);
		ready = true;
	});
</script>

<span
	bind:this={root}
	class="orb"
	class:ready
	class:anti={params.anti}
	style:color={`var(--${particle.category})`}
	style:--d={`${diameter}px`}
	style:--frame={`${size / 0.62}px`}
	style:--spin={spin}
	aria-hidden="true"
>
	<canvas bind:this={fog} class="fog"></canvas>
	<span class="fallback"></span>
	<span class="glass"></span>
	{#each moons as category, i (i)}
		<span
			class="moon"
			style:--mc={`var(--${category})`}
			style:--turn={`${(360 / moons.length) * i}deg`}
			style:--orbit={`${3 + moons.length}s`}
		></span>
	{/each}
</span>

<style>
	.orb {
		position: relative;
		display: inline-block;
		flex: none;
		width: var(--d);
		height: var(--d);
		border-radius: 50%;
	}

	/* The shader frame is wider than the sphere (it holds the halo), so it
	   overflows the orb box, centred, and turns about the centre. */
	.fog {
		position: absolute;
		top: 50%;
		left: 50%;
		width: var(--frame);
		height: var(--frame);
		pointer-events: none;
		opacity: 0;
		transform: translate(-50%, -50%);
		animation: turn var(--spin) linear infinite;
		transition: opacity 0.3s;
	}

	.ready .fog {
		opacity: 1;
	}

	/* Stand-in until the shader snapshot is ready: a soft, translucent glow. */
	.fallback {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: radial-gradient(
			circle at 50% 50%,
			color-mix(in srgb, currentColor 35%, white) 0%,
			color-mix(in srgb, currentColor 55%, transparent) 28%,
			color-mix(in srgb, currentColor 18%, transparent) 62%,
			color-mix(in srgb, currentColor 55%, transparent) 94%,
			transparent 100%
		);
		box-shadow: 0 0 calc(var(--d) * 0.35) color-mix(in srgb, currentColor 55%, transparent);
		transition: opacity 0.3s;
	}

	.anti .fallback {
		background: radial-gradient(
			circle at 50% 50%,
			color-mix(in srgb, currentColor 10%, transparent) 0%,
			color-mix(in srgb, currentColor 15%, transparent) 50%,
			color-mix(in srgb, currentColor 75%, white) 92%,
			transparent 100%
		);
	}

	.ready .fallback {
		opacity: 0;
	}

	/* A fixed glass glint and rim, so the light source stays put while the fog turns. */
	.glass {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background:
			radial-gradient(
				ellipse 38% 26% at 34% 24%,
				rgb(255 255 255 / 0.55),
				rgb(255 255 255 / 0.12) 55%,
				transparent 72%
			),
			radial-gradient(circle at 50% 50%, transparent 86%, rgb(255 255 255 / 0.18) 97%, transparent);
	}

	/* Constituents of a composite orbit its surface. */
	.moon {
		position: absolute;
		top: 50%;
		left: 50%;
		width: calc(var(--d) * 0.22);
		height: calc(var(--d) * 0.22);
		margin: calc(var(--d) * -0.11);
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, white, var(--mc) 55%);
		box-shadow: 0 0 calc(var(--d) * 0.12) var(--mc);
		animation: orbit var(--orbit) linear infinite;
		transform: rotate(var(--turn)) translateX(calc(var(--d) * 0.5)) rotate(calc(-1 * var(--turn)));
	}

	@keyframes turn {
		to {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}

	@keyframes orbit {
		from {
			transform: rotate(var(--turn)) translateX(calc(var(--d) * 0.5)) rotate(calc(-1 * var(--turn)));
		}
		to {
			transform: rotate(calc(var(--turn) + 360deg)) translateX(calc(var(--d) * 0.5))
				rotate(calc(-1 * var(--turn) - 360deg));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.fog,
		.moon {
			animation: none;
		}
	}
</style>
