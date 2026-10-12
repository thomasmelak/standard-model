import { createOrbRenderer, type OrbRenderer } from './renderer';
import type { OrbParams } from './params';

// Tiles show dozens of orbs at once, more WebGL contexts than a browser allows,
// so they share one offscreen context: each orb is drawn once, copied into a
// cached 2D canvas, and animated by the page with cheap CSS transforms.

let shared: { canvas: HTMLCanvasElement; renderer: OrbRenderer } | null | undefined;
const cache = new Map<string, HTMLCanvasElement>();

function sharedRenderer() {
	if (shared !== undefined) return shared;
	try {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true });
		shared = gl ? { canvas, renderer: createOrbRenderer(gl) } : null;
	} catch {
		shared = null;
	}
	return shared;
}

/**
 * A still image of an orb, without glass highlights (the page overlays a
 * static one so the image can rotate). Undefined when WebGL is unavailable.
 */
export function orbSnapshot(
	params: OrbParams,
	color: [number, number, number],
	px: number
): HTMLCanvasElement | undefined {
	const key = [params.radius, params.turbulence, params.anti, params.seed, color.join(), px].join(
		'|'
	);
	const hit = cache.get(key);
	if (hit) return hit;

	const r = sharedRenderer();
	if (!r) return undefined;
	r.canvas.width = px;
	r.canvas.height = px;
	// Freeze each orb at a different moment so their fog doesn't line up.
	r.renderer.draw({ ...params, color, time: 3 + params.seed * 20, highlight: 0 });

	const copy = document.createElement('canvas');
	copy.width = px;
	copy.height = px;
	copy.getContext('2d')?.drawImage(r.canvas, 0, 0);
	cache.set(key, copy);
	return copy;
}
