// The orb's fragment shader. GLSL ES 1.00 (WebGL 1), premultiplied-alpha output.
// Uniforms: time, color, radius, turbulence, anti, seed, highlight (see params.ts).

export const ORB_VERTEX = `
	attribute vec2 position;
	varying vec2 uv;
	void main() { uv = position; gl_Position = vec4(position, 0.0, 1.0); }
`;

export const ORB_FRAGMENT = `
		precision mediump float;
		varying vec2 uv;
		uniform float time;
		uniform vec3 color;
		uniform float radius;
		uniform float turbulence;
		uniform float anti;
		uniform float seed;
		uniform float highlight;

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
