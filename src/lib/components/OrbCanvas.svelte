<script lang="ts">
	import { onMount } from 'svelte';
	import Orb from './Orb.svelte';
	import { particleStats, type Particle } from '#lib/physics/index.ts';

	// A real-time 3D orb: a lit sphere with an animated plasma surface, rim light
	// and a halo, drawn by one fragment shader. Falls back to the CSS orb when
	// WebGL is unavailable (and during server rendering).

	let { particle, size = 200 }: { particle: Particle; size?: number } = $props();

	const stats = $derived(particleStats(particle));
	const hp = $derived(stats.find((s) => s.key === 'hp')!.value);
	const power = $derived(stats.find((s) => s.key === 'power')!.value);
	const anti = $derived(
		particle.baryon3 < 0 || particle.leptonE + particle.leptonMu + particle.leptonTau < 0
	);

	let canvas = $state<HTMLCanvasElement>();
	let webgl = $state(false);
	/** Draws one frame; set once WebGL is ready. */
	let redraw: (() => void) | undefined;

	const VERTEX = `
		attribute vec2 position;
		varying vec2 uv;
		void main() { uv = position; gl_Position = vec4(position, 0.0, 1.0); }
	`;

	const FRAGMENT = `
		precision mediump float;
		varying vec2 uv;
		uniform float time;
		uniform vec3 color;
		uniform float radius;
		uniform float turbulence;
		uniform float anti;

		float hash(vec3 p) {
			p = fract(p * 0.3183099 + 0.1);
			p *= 17.0;
			return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
		}

		float noise(vec3 x) {
			vec3 i = floor(x);
			vec3 f = fract(x);
			f = f * f * (3.0 - 2.0 * f);
			return mix(
				mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
					mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
				mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
					mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
				f.z);
		}

		float fbm(vec3 p) {
			float v = 0.0;
			float a = 0.5;
			for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
			return v;
		}

		void main() {
			float d = length(uv);
			float pulse = 0.85 + 0.15 * sin(time * (1.0 + turbulence * 5.0));

			if (d < radius) {
				// Point on the sphere and its normal.
				vec3 n = normalize(vec3(uv, sqrt(radius * radius - d * d)));
				// Spin the surface around the vertical axis.
				float a = time * 0.35;
				vec3 q = vec3(n.x * cos(a) - n.z * sin(a), n.y, n.x * sin(a) + n.z * cos(a));
				float plasma = fbm(q * (2.5 + turbulence * 3.0) + vec3(0.0, time * (0.15 + turbulence), 0.0));

				vec3 light = normalize(vec3(-0.45, 0.55, 0.7));
				float diffuse = max(dot(n, light), 0.0);
				float spec = pow(max(dot(reflect(-light, n), vec3(0, 0, 1)), 0.0), 24.0);
				float rim = pow(1.0 - n.z, 2.2);

				vec3 hot = mix(color, vec3(1.0), 0.55);
				vec3 body = color * (0.25 + 0.75 * diffuse) + hot * smoothstep(0.45, 0.85, plasma) * 0.9;
				// Antimatter: dark core, blazing rim.
				body = mix(body, color * 0.15 + hot * smoothstep(0.5, 0.9, plasma) * 0.5, anti * (1.0 - rim));
				vec3 col = body + hot * rim * (0.8 + anti) * pulse + vec3(spec * 0.8);
				gl_FragColor = vec4(col, 1.0);
			} else {
				// Halo, fading with distance from the surface.
				float g = exp(-(d - radius) * 7.0) * 0.85 * pulse;
				gl_FragColor = vec4(color * g, g);
			}
		}
	`;

	function compile(gl: WebGLRenderingContext, type: number, source: string) {
		const shader = gl.createShader(type)!;
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new Error(gl.getShaderInfoLog(shader) ?? 'shader compile failed');
		}
		return shader;
	}

	function parseRgb(css: string): [number, number, number] {
		const m = css.match(/\d+(\.\d+)?/g)?.map(Number) ?? [255, 255, 255];
		return [m[0] / 255, m[1] / 255, m[2] / 255];
	}

	onMount(() => {
		const gl = canvas?.getContext('webgl', { premultipliedAlpha: true, alpha: true });
		if (!canvas || !gl) return;

		let program: WebGLProgram;
		try {
			program = gl.createProgram()!;
			gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
			gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
			gl.linkProgram(program);
			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
		} catch {
			return;
		}
		webgl = true;
		gl.useProgram(program);

		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
		const position = gl.getAttribLocation(program, 'position');
		gl.enableVertexAttribArray(position);
		gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

		const uniform = (name: string) => gl.getUniformLocation(program, name);
		const u = {
			time: uniform('time'),
			color: uniform('color'),
			radius: uniform('radius'),
			turbulence: uniform('turbulence'),
			anti: uniform('anti')
		};

		const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
		let frame = 0;
		let raf = 0;
		let rgb: [number, number, number] = [1, 1, 1];
		let shown = '';
		const start = performance.now();

		const draw = () => {
			const c = canvas!;
			const dpr = Math.min(devicePixelRatio, 2);
			const px = Math.round(c.clientWidth * dpr);
			if (c.width !== px) {
				c.width = px;
				c.height = px;
			}
			// The colour comes from the theme, which can change at any time.
			if (frame++ % 30 === 0 || particle.category !== shown) {
				rgb = parseRgb(getComputedStyle(c).color);
				shown = particle.category;
			}
			gl.viewport(0, 0, c.width, c.height);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.uniform1f(u.time, reduceMotion ? 0 : (performance.now() - start) / 1000);
			gl.uniform3f(u.color, ...rgb);
			gl.uniform1f(u.radius, 0.42 + (power / 100) * 0.2);
			gl.uniform1f(u.turbulence, 1 - hp / 100);
			gl.uniform1f(u.anti, anti ? 1 : 0);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			if (!reduceMotion) raf = requestAnimationFrame(draw);
		};
		redraw = draw;
		draw();

		return () => {
			redraw = undefined;
			cancelAnimationFrame(raf);
			gl.getExtension('WEBGL_lose_context')?.loseContext();
		};
	});

	// The animation loop picks up a new particle on its next frame; without
	// motion there is no loop, so draw the new particle once.
	$effect(() => {
		void [hp, power, anti, particle.category];
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) redraw?.();
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
