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

	interface Props {
		particle: Particle;
		size?: number;
		/** Drag inside the sphere to orbit the camera around it (the full-screen view). */
		rotatable?: boolean;
	}

	let { particle, size = 200, rotatable = false }: Props = $props();

	const params = $derived(orbParams(particle));

	// Camera orbit: yaw and pitch in radians, plus a spin that carries on after release.
	let view: [number, number] = [0, 0];
	let velocity: [number, number] = [0, 0];
	let drag: { x: number; y: number; t: number; id: number } | null = null;
	const MAX_PITCH = 1.3;

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
			// Momentum after a drag, fading out.
			if (!drag && Math.hypot(...velocity) > 1e-4) {
				view = [view[0] + velocity[0], clampPitch(view[1] + velocity[1])];
				velocity = [velocity[0] * 0.94, velocity[1] * 0.94];
			}
			renderer.draw({
				...params,
				color,
				view,
				// A still orb is frozen at a moment that depends on the particle.
				time: reduceMotion ? 3 + params.seed * 20 : (performance.now() - start) / 1000,
				highlight: 1
			});
			if (!reduceMotion) raf = requestAnimationFrame(draw);
		};
		redraw = reduceMotion ? draw : undefined;
		draw();
		// Without an animation loop, a canvas that gets its size after mounting (e.g.
		// in a dialog that just opened) must be redrawn when it does.
		const resized = new ResizeObserver(() => redraw?.());
		resized.observe(canvas);

		return () => {
			resized.disconnect();
			redraw = undefined;
			cancelAnimationFrame(raf);
			renderer.dispose();
			gl.getExtension('WEBGL_lose_context')?.loseContext();
		};
	});

	const clampPitch = (p: number) => Math.max(-MAX_PITCH, Math.min(MAX_PITCH, p));

	/** Is the point inside the sphere (not its halo)? Drags elsewhere are left for swipes. */
	function onSphere(e: PointerEvent) {
		const r = canvas!.getBoundingClientRect();
		const x = (e.clientX - r.left) / r.width - 0.5;
		const y = (e.clientY - r.top) / r.height - 0.5;
		return Math.hypot(x, y) * 2 < params.radius * 1.05;
	}

	function onpointerdown(e: PointerEvent) {
		if (!rotatable || !webgl || e.button !== 0 || !onSphere(e)) return;
		// This drag rotates the orb; keep it from also counting as a swipe.
		e.stopPropagation();
		canvas!.setPointerCapture(e.pointerId);
		drag = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
		velocity = [0, 0];
	}

	function onpointermove(e: PointerEvent) {
		if (!drag || e.pointerId !== drag.id) return;
		// Dragging across the whole canvas turns the orb half a revolution.
		const k = Math.PI / canvas!.clientWidth;
		const d: [number, number] = [(e.clientX - drag.x) * k, (e.clientY - drag.y) * k];
		const now = performance.now();
		const frames = Math.max(1, (now - drag.t) / 16.7);
		view = [view[0] + d[0], clampPitch(view[1] + d[1])];
		velocity = [d[0] / frames, d[1] / frames];
		drag = { ...drag, x: e.clientX, y: e.clientY, t: now };
		redraw?.();
	}

	function onpointerup(e: PointerEvent) {
		if (!drag || e.pointerId !== drag.id) return;
		e.stopPropagation();
		// A pause before letting go means no fling.
		if (performance.now() - drag.t > 80) velocity = [0, 0];
		drag = null;
	}

	function ondblclick() {
		if (!rotatable) return;
		view = [0, 0];
		velocity = [0, 0];
		redraw?.();
	}

	// Each particle starts face-on.
	$effect(() => {
		void particle.id;
		view = [0, 0];
		velocity = [0, 0];
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
		class:rotatable
		style:color={`var(--${particle.category})`}
		aria-hidden="true"
		{onpointerdown}
		{onpointermove}
		{onpointerup}
		onpointercancel={() => (drag = null)}
		{ondblclick}
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

	/* Touch drags on the orb rotate it instead of scrolling the page. */
	canvas.rotatable {
		cursor: grab;
		touch-action: none;
	}

	canvas.rotatable:active {
		cursor: grabbing;
	}

	canvas.hidden {
		visibility: hidden;
	}
</style>
