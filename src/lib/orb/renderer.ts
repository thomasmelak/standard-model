import { ORB_FRAGMENT, ORB_VERTEX } from './shader';
import type { OrbParams } from './params';

export interface OrbFrame extends OrbParams {
	color: [number, number, number];
	time: number;
	/** 1 draws the glass highlights; 0 leaves them out (for snapshots that get rotated). */
	highlight: number;
	/** Camera yaw and pitch in radians, for dragging the orb around. Defaults to [0, 0]. */
	view?: [number, number];
}

export interface OrbRenderer {
	/** Draws one frame into the context's canvas at its current size. */
	draw(frame: OrbFrame): void;
	dispose(): void;
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
	const shader = gl.createShader(type);
	if (!shader) throw new Error('could not create shader');
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw new Error(gl.getShaderInfoLog(shader) ?? 'shader compile failed');
	}
	return shader;
}

/** Compiles the orb shader into a context. Throws if the GPU or driver can't run it. */
export function createOrbRenderer(gl: WebGLRenderingContext): OrbRenderer {
	const program = gl.createProgram();
	if (!program) throw new Error('could not create program');
	gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, ORB_VERTEX));
	gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, ORB_FRAGMENT));
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		throw new Error(gl.getProgramInfoLog(program) ?? 'shader link failed');
	}
	gl.useProgram(program);

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
	const position = gl.getAttribLocation(program, 'position');
	gl.enableVertexAttribArray(position);
	gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

	const at = (name: string) => gl.getUniformLocation(program, name);
	const u = {
		time: at('time'),
		color: at('color'),
		radius: at('radius'),
		turbulence: at('turbulence'),
		anti: at('anti'),
		seed: at('seed'),
		highlight: at('highlight'),
		view: at('view')
	};

	return {
		draw(f) {
			const { width, height } = gl.canvas;
			gl.viewport(0, 0, width, height);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.uniform1f(u.time, f.time);
			gl.uniform3f(u.color, ...f.color);
			gl.uniform1f(u.radius, f.radius);
			gl.uniform1f(u.turbulence, f.turbulence);
			gl.uniform1f(u.anti, f.anti);
			gl.uniform1f(u.seed, f.seed);
			gl.uniform1f(u.highlight, f.highlight);
			gl.uniform2f(u.view, ...(f.view ?? [0, 0]));
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		},
		dispose() {
			gl.deleteBuffer(buffer);
			gl.deleteProgram(program);
		}
	};
}
