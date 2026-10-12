<script lang="ts">
	import { onMount } from 'svelte';
	import Orb from './Orb.svelte';
	import { orbParams, parseRgb } from '#lib/orb/params.ts';
	import { createOrbRenderer, type OrbRenderer } from '#lib/orb/renderer.ts';
	import { themeVersion } from '#lib/orb/theme.svelte.ts';
	import type { Particle } from '#lib/physics/index.ts';

	// The card's live orb: a translucent, foggy sphere raymarched in a fragment
	// shader (see #lib/orb/shader.ts). Falls back to the CSS orb when WebGL is
	// unavailable, and during server rendering.

	let { particle, size = 200 }: { particle: Particle; size?: number } = $props();

	const params = $derived(orbParams(particle));

	let canvas = $state<HTMLCanvasElement>();
	let webgl = $state(false);
	let color: [number, number, number] = [1, 1, 1];
	/** Draws one frame; set once WebGL is ready. */
	let redraw: (() => void) | undefined;

	onMount(() => {
		const gl = canvas?.getContext('webgl', { premultipliedAlpha: true, alpha: true });
		if (!canvas || !gl) return;

		let renderer: OrbRenderer;
		try {
			renderer = createOrbRenderer(gl);
		} catch {
			return;
		}
		webgl = true;
		color = parseRgb(getComputedStyle(canvas).color);

		const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const start = performance.now();
		let raf = 0;

		const draw = () => {
			const c = canvas!;
			const px = Math.round(c.clientWidth * Math.min(devicePixelRatio, 2));
			if (c.width !== px) {
				c.width = px;
				c.height = px;
			}
			renderer.draw({
				...params,
				color,
				// A still orb is frozen at a moment that depends on the particle.
				time: reduceMotion ? 3 + params.seed * 20 : (performance.now() - start) / 1000,
				highlight: 1
			});
			if (!reduceMotion) raf = requestAnimationFrame(draw);
		};
		redraw = reduceMotion ? draw : undefined;
		draw();

		return () => {
			redraw = undefined;
			cancelAnimationFrame(raf);
			renderer.dispose();
			gl.getExtension('WEBGL_lose_context')?.loseContext();
		};
	});

	// Re-read the colour when the particle or theme changes. The animation loop
	// picks it up on its next frame; without motion, draw once now.
	$effect(() => {
		void [themeVersion(), particle.category, params];
		if (!canvas) return;
		color = parseRgb(getComputedStyle(canvas).color);
		redraw?.();
	});
</script>

<span class="stage" style:--size={`${size}px`}>
	<canvas
		bind:this={canvas}
		class:hidden={!webgl}
		style:color={`var(--${particle.category})`}
		aria-hidden="true"
	></canvas>
	{#if !webgl}
		<Orb {particle} size={size * 0.6} />
	{/if}
</span>

<style>
	.stage {
		display: grid;
		place-items: center;
		width: var(--size);
		height: var(--size);
	}

	.stage > :global(*) {
		grid-area: 1 / 1;
	}

	canvas {
		width: 100%;
		height: 100%;
	}

	canvas.hidden {
		visibility: hidden;
	}
</style>
