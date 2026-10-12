<script lang="ts">
	import { getParticle, particleStats, type Particle } from '#lib/physics/index.ts';

	interface Props {
		particle: Particle;
		/** Diameter in pixels of the largest orb; lighter particles render smaller. */
		size?: number;
	}

	let { particle, size = 64 }: Props = $props();

	const stats = $derived(particleStats(particle));
	const hp = $derived(stats.find((s) => s.key === 'hp')!.value);
	const power = $derived(stats.find((s) => s.key === 'power')!.value);

	// Heavier particles are bigger; massless ones still get a visible core.
	const diameter = $derived(Math.round(size * (0.62 + (power / 100) * 0.38)));
	// Unstable particles pulse faster.
	const pulse = $derived(`${(0.8 + (hp / 100) * 3.2).toFixed(2)}s`);
	const anti = $derived(
		particle.baryon3 < 0 || particle.leptonE + particle.leptonMu + particle.leptonTau < 0
	);
	const moons = $derived(
		particle.elementary ? [] : particle.constituents.map((id) => getParticle(id).category)
	);
</script>

<span
	class="orb"
	class:anti
	style:--c={`var(--${particle.category})`}
	style:--d={`${diameter}px`}
	style:--pulse={pulse}
	aria-hidden="true"
>
	<span class="plasma"></span>
	<span class="shine"></span>
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
		/* Lit from the upper left: highlight, body colour, then a dark limb. */
		background: radial-gradient(
			circle at 34% 30%,
			color-mix(in srgb, var(--c) 25%, white) 0%,
			var(--c) 38%,
			color-mix(in srgb, var(--c) 45%, black) 78%,
			color-mix(in srgb, var(--c) 20%, black) 100%
		);
		box-shadow:
			0 0 calc(var(--d) * 0.35) color-mix(in srgb, var(--c) 70%, transparent),
			inset calc(var(--d) * -0.08) calc(var(--d) * -0.1) calc(var(--d) * 0.2) rgb(0 0 0 / 0.35);
		animation: glow var(--pulse) ease-in-out infinite alternate;
	}

	/* Antimatter: a dark core with a bright rim, the inverse of a normal orb. */
	.orb.anti {
		background: radial-gradient(
			circle at 50% 50%,
			color-mix(in srgb, var(--c) 15%, black) 0%,
			color-mix(in srgb, var(--c) 35%, black) 48%,
			var(--c) 80%,
			color-mix(in srgb, var(--c) 30%, white) 100%
		);
	}

	/* A slowly turning swirl that reads as the orb's surface rotating. */
	.plasma {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: conic-gradient(
			from 0deg,
			transparent 0deg,
			color-mix(in srgb, var(--c) 40%, white) 60deg,
			transparent 130deg,
			color-mix(in srgb, var(--c) 30%, white) 220deg,
			transparent 300deg
		);
		mix-blend-mode: soft-light;
		opacity: 0.6;
		animation: spin 9s linear infinite;
	}

	.shine {
		position: absolute;
		top: 12%;
		left: 18%;
		width: 34%;
		height: 24%;
		border-radius: 50%;
		background: radial-gradient(ellipse, rgb(255 255 255 / 0.75), transparent 70%);
		transform: rotate(-30deg);
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

	@keyframes glow {
		to {
			box-shadow:
				0 0 calc(var(--d) * 0.55) color-mix(in srgb, var(--c) 85%, transparent),
				inset calc(var(--d) * -0.08) calc(var(--d) * -0.1) calc(var(--d) * 0.2) rgb(0 0 0 / 0.35);
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
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
		.orb,
		.plasma,
		.moon {
			animation: none;
		}
	}
</style>
