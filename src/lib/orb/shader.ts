// The orb's fragment shader: a translucent glass sphere filled with raymarched,
// swirling fog and energy filaments around a bright core. GLSL ES 1.00 (WebGL 1),
// premultiplied-alpha output.
// Uniforms: time, color, radius, turbulence, anti, seed, highlight (see params.ts).

export const ORB_VERTEX = `
	attribute vec2 position;
	varying vec2 uv;
	void main() { uv = position; gl_Position = vec4(position, 0.0, 1.0); }
`;

export const ORB_FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

// Translucent energy orb: a glass sphere filled with raymarched glowing fog and
// swirling ridged energy filaments that wrap a hot, streaky core.
// Output is premultiplied alpha.
//
// Cost per interior pixel: fog 24 steps x 3 value-noise (2 octaves + 1 detail)
// = 72, filaments <= 10 shell hits x 1 value-noise mask = 10 (+ analytic gyroids),
// rim variation 1  ->  ~83 value-noise evaluations. Outside the sphere: 0 noise.
// Noise coordinates are never translated by time; animation is done by rotating
// frames (precision-safe for long sessions / mediump fallback).
varying vec2 uv;
uniform float time;
uniform vec3 color;
uniform float radius;
uniform float turbulence;
uniform float anti;
uniform float seed;
uniform float highlight;

#define FOG_STEPS 24
#define SHELLS 5
#define TAU 6.2831853

vec4 hash4(vec4 n) {
	n = fract(n * 0.1031);
	n *= n + 33.33;
	n *= n + n;
	return fract(n);
}

float hash12(vec2 p) {
	vec3 p3 = fract(vec3(p.xyx) * 0.1031);
	p3 += dot(p3, p3.yzx + 33.33);
	return fract((p3.x + p3.y) * p3.z);
}

// value noise, 2 vectorised hashes per lookup
float noise(vec3 x) {
	vec3 i = floor(x);
	vec3 f = x - i;
	f = f * f * (3.0 - 2.0 * f);
	float n = i.x + i.y * 57.0 + i.z * 113.0;
	vec4 a = hash4(vec4(n, n + 1.0, n + 57.0, n + 58.0));
	vec4 b = hash4(vec4(n + 113.0, n + 114.0, n + 170.0, n + 171.0));
	vec4 c = mix(a, b, f.z);
	vec2 e = mix(c.xz, c.yw, f.x);
	return mix(e.x, e.y, f.y);
}

mat2 rot(float a) {
	float c = cos(a);
	float s = sin(a);
	return mat2(c, s, -s, c);
}

// wrapped angle for a time-driven rotation (keeps sin/cos arguments small)
float wa(float rate) {
	return mod(time * rate, TAU);
}

float gyroid(vec3 q) {
	return dot(sin(q), cos(q.yzx));
}

void main() {
	float R = radius;
	float d = length(uv);
	float turb = clamp(turbulence, 0.0, 1.0);
	float px = 2.0 / 380.0;
	float sgn = 1.0 - 2.0 * anti;
	vec3 hot = mix(color, vec3(1.0), 0.45);
	vec3 deep = color * color * 0.85;

	// flicker (sin-based, no noise): unstable particles shimmer
	float fr = 1.5 + 10.0 * turb;
	float fw = 0.5 * sin(wa(fr * 1.0) + seed * 20.0) + 0.3 * sin(wa(fr * 2.37) + seed * 7.0) + 0.2 * sin(wa(fr * 4.13) + seed * 3.0);
	float flicker = 1.0 + turb * 0.5 * fw;

	// ---- halo outside the glass (0 noise) ----
	float hd = max(d - R, 0.0) / R;
	float halo = (exp(-hd * 6.0) * 0.26 + exp(-hd * 20.0) * 0.4) * flicker * (1.0 + 0.3 * anti);
	halo *= smoothstep(1.0, 0.7, hd) * smoothstep(1.0, 0.85, d); // exactly 0 at the canvas edge
	vec4 outside = vec4(color * halo, halo);
	if (d > R + px) {
		gl_FragColor = outside;
		return;
	}

	// ---- refracted view ray through the unit sphere ----
	vec2 p2 = uv / R;
	float r2 = min(dot(p2, p2), 0.9995);
	float rr = sqrt(r2);
	float z = sqrt(1.0 - r2);
	vec3 n = vec3(p2, z);
	vec3 rd = refract(vec3(0.0, 0.0, -1.0), n, 0.78);
	float bpar = dot(n, rd);
	float chord = -2.0 * bpar;
	float b2 = max(1.0 - bpar * bpar, 0.0); // squared closest distance of the ray to the core
	float bdist = sqrt(b2);

	float spinRate = (0.2 + 0.9 * turb * turb + 0.3 * turb) * sgn;
	float spin = wa(spinRate); // only used with integer multiples
	float twist = (2.6 + 1.8 * turb) * sgn;
	mat2 tiltA = rot(0.45 + seed * 2.3);
	mat2 tiltB = rot(-0.3 + seed * 3.7);
	vec3 so = vec3(seed * 7.0, seed * 5.0, seed * 3.0); // small: keeps hash inputs low under mediump
	// counter-rotating frames: the fog evolves without winding up
	mat2 evo1 = rot(wa(-(0.13 + 0.5 * turb) * sgn));
	mat2 evo2 = rot(wa(0.09 + 0.7 * turb));
	float warpAmt = 0.55 + 0.6 * turb;

	// ---- 1) fog: jittered emission-absorption march ----
	float dt = chord / float(FOG_STEPS);
	// antimatter: everything behind the hollow core is hidden (smooth in depth -> no dither)
	float voidM = anti * smoothstep(0.36, 0.26, bdist);
	float jit = hash12(gl_FragCoord.xy + floor(seed * 97.0)); // white-noise jitter (IGN showed a diagonal pattern on dense orbs)
	jit = mix(jit, 0.5, voidM); // thin fog in the hollow core cannot hide the jitter grain
	vec3 pos = n + rd * dt * jit;
	vec3 acc = vec3(0.0);
	float T = 1.0;
	float Thalf = -1.0;
	float lift = 1.0 - 0.3 * turb; // unstable orbs: more motion, not more milk
	float tc = dt * jit;
	for (int i = 0; i < FOG_STEPS; i++) {
		vec3 p = pos;
		float r = length(p);
		p.yz = tiltA * p.yz;
		p.xy = tiltB * p.xy;
		float om = 1.0 - r;
		p.xz = rot(wa(spinRate * 0.6) + twist * om * om) * p.xz;

		float f1 = noise(p * 1.6 + so);
		// second octave lives in a counter-rotating frame and is warped by the first
		vec3 q = p;
		q.xz = evo1 * q.xz;
		q.xy = evo2 * q.xy;
		q += (f1 - 0.5) * warpAmt;
		float f2 = noise(q * 3.7 + so.zxy);
		// fine detail octave: wispy ridges
		float f3 = noise(q.zxy * (6.0 + 2.0 * turb) + so.yzx);
		float fog = f1 * 0.6 + f2 * 0.4;
		// thin smoke sheets: ridged second octave, broken up by the detail octave
		float ridge = 1.0 - abs(f2 * 2.0 - 1.0);
		ridge *= ridge * ridge * (0.4 + 1.2 * f3);

		float edgeFade = smoothstep(1.0, 0.82, r);
		float shapeM = (0.5 + 0.55 * exp(-r * r * 3.0)) * (1.0 - 0.4 * turb);
		float shapeA = 0.02 + 0.55 * smoothstep(0.42, 0.8, r);
		float shape = edgeFade * mix(shapeM, shapeA, anti);
		float wisp = smoothstep(0.44 + 0.1 * turb + 0.1 * anti, 0.82, fog) * (0.6 + 0.8 * f3);
		float dens = shape * (0.02 - 0.015 * anti + (2.4 + 0.8 * anti) * wisp * wisp + 2.6 * ridge * smoothstep(0.3, 0.6, fog));
		// fog is lit by the core (matter) or by the bright shell (antimatter)
		float lit = mix(0.5 + 2.2 * exp(-r * r * 5.0), 0.15 + 1.7 * smoothstep(0.35, 0.92, r) * (0.4 + 1.2 * wisp), anti);
		float behind = 1.0 - voidM * smoothstep(-0.15, 0.15, tc - chord * 0.5);

		vec3 ec = mix(deep, color, clamp(0.25 + 0.35 * lit * wisp, 0.0, 1.0));
		ec = mix(ec, hot, clamp(ridge * (lit - 0.6) * 0.2, 0.0, 0.35));
		acc += T * ec * (dens * lit * 0.85 * lift * behind) * dt;
		T *= exp(-dens * 1.05 * dt);
		if (i == FOG_STEPS / 2 - 1) Thalf = T;
		if (T < 0.01) break;
		pos += rd * dt;
		tc += dt;
	}
	if (Thalf < 0.0) Thalf = T;
	// approximate transmittance at depth t along the ray (piecewise exponential)
	float lnA = log(max(Thalf, 1e-4));
	float lnB = log(max(T, 1e-4)) - lnA;
	float halfC = chord * 0.5;

	// ---- 2) filaments: ridged swirl-warped gyroid on 5 nested shells ----
	float filL = 0.0;
	float sharp = 9.0 + 14.0 * turb;              // broad sweeping bands when stable, thin when unstable
	float fsc = 0.8 + 0.4 * turb;                 // capped density: no tangled yarn at high turbulence
	vec3 ph = mod(vec3(2.0, -1.5, 1.2) * time * (0.10 + 0.6 * turb), TAU);
	mat2 evoM = rot(wa(0.15 + 0.45 * turb));
	float use2 = step(0.3, turb);                  // uniform-coherent: skip 2nd octave on calm orbs
	for (int k = 0; k < SHELLS; k++) {
		float fk = float(k);
		float rk = 0.24 + 0.155 * fk;
		float disc = bpar * bpar - (1.0 - rk * rk);
		if (disc > 0.0) {
			float sq = sqrt(disc);
			// mild limb brightening, faded out towards tangency so shell outlines never show
			float sr = sq / rk;
			float limb = pow(1.0 / max(sr, 0.45), 0.4) * smoothstep(0.0, 0.85, sr);
			// antimatter keeps only the outer shells; inner shells fade as turbulence rises
			float wk = mix(1.0 - 0.45 * turb * (1.0 - fk / 4.0), smoothstep(0.38, 0.6, rk), anti) * (0.65 + 0.35 * fk / 4.0);
			float shellFl = 1.0 + turb * 0.6 * sin(wa(5.0 + 3.0 * fk) + fk * 2.0 + seed * 9.0);
			for (int j = 0; j < 2; j++) {
				float t = -bpar + (j == 0 ? -sq : sq);
				vec3 s = n + rd * t;
				s.yz = tiltA * s.yz;
				s.xy = tiltB * s.xy;
				float om = 1.0 - rk;
				s.xz = rot(wa(spinRate * (1.0 + 0.45 * fk)) + twist * om * om + fk * 1.3) * s.xz;
				vec3 q = s * vec3(2.4, 4.2, 2.4) * fsc + so + fk * vec3(1.7, 0.9, 2.3);
				q += (0.5 + 0.4 * turb) * sin(q.yzx * 1.1 + ph);
				float g = gyroid(q);
				float ridge = 1.0 - min(abs(g) / 1.5, 1.0);
				float r2p = ridge * ridge;
				float line = pow(ridge, sharp) * 1.1 + (0.38 - 0.14 * turb) * r2p * r2p * ridge + 0.07 * r2p;
				if (use2 > 0.5) {
					float g2 = gyroid(q * 2.1 + vec3(3.1, -1.2, 0.7));
					float rg2 = 1.0 - min(abs(g2) / 1.5, 1.0);
					line += 0.35 * pow(rg2, sharp * 1.3) * turb;
				}
				// sparse: fade whole strands in and out (counter-rotating mask frame)
				vec3 sm = s;
				sm.xy = evoM * sm.xy;
				float m = noise(sm * (2.4 + 1.2 * turb) + so.yzx + fk * 3.1);
				line *= smoothstep(0.36 - 0.06 * turb, 0.72, m);
				float depthT = t < halfC ? exp(lnA * t / halfC) : exp(lnA + lnB * (t - halfC) / halfC);
				float att = depthT * (j == 0 ? 1.0 : 0.8 * (1.0 - voidM));
				filL += line * limb * wk * att * shellFl;
			}
		}
	}
	filL *= flicker;

	vec3 col = acc * flicker;
	vec3 filC = mix(color, vec3(1.0), 0.12);
	col += filC * filL * 1.15 + hot * filL * filL * 0.45;

	// ---- core (matter): analytic gaussian line integral + elongated swirl-aligned streak ----
	float ang = atan(p2.y, p2.x);
	float Tc = sqrt(max(Thalf, 0.0) + 0.15);
	float coreLine = exp(-b2 * 90.0) * 0.32 + exp(-b2 * 16.0) * 0.2 + exp(-b2 * 4.0) * 0.06;
	vec2 sd = rot(0.75 + seed * 1.2 + wa(spinRate * 0.25)) * p2;
	sd.x += (0.35 + 0.3 * seed) * sd.y * sd.y * sgn - 0.06 * sin(sd.y * 7.0 + spin); // curved, wavering wisp, not a beam
	float streak = exp(-(sd.x * sd.x * 160.0 + sd.y * sd.y * 9.0)) * 0.8
	             + exp(-(sd.x * sd.x * 30.0 + sd.y * sd.y * 2.2)) * 0.18;
	vec2 sd2 = rot(2.1 + seed * 0.7 - wa(spinRate * 0.4)) * p2;
	streak += exp(-(sd2.x * sd2.x * 500.0 + sd2.y * sd2.y * 14.0)) * 0.35;
	col += (hot * 0.6 + vec3(0.4)) * (coreLine * (7.0 - 2.5 * turb) + streak * (1.0 - 0.3 * turb)) * (1.0 - anti) * flicker * Tc;

	// starburst rays from the core (matter)
	float rays = 0.0;
	for (int l = 0; l < 2; l++) {
		float fl2 = float(l);
		float N = 9.0 + 8.0 * fl2;
		float a = fract((ang + wa(spinRate * (0.05 + 0.04 * fl2))) / TAU + fl2 * 0.31) * N;
		float c = floor(a);
		float h = hash12(vec2(c, fl2 * 7.0 + floor(seed * 50.0)));
		float h2 = hash12(vec2(c * 1.3 + 4.0, fl2 * 3.0 + floor(seed * 23.0)));
		float off = 0.2 + 0.6 * h;
		float len = (0.08 + 0.22 * h2 * h2) * (0.8 + 0.7 * turb);
		float taper = max(1.0 - rr / len, 0.0);
		float w = 0.004 + 0.014 * taper;
		float dperp = abs(fract(a) - off) * (TAU / N) * rr;
		float on = step(0.3 - 0.2 * turb, h2);
		rays += on * exp(-dperp * dperp / (w * w)) * taper * taper * (0.6 + 0.6 * h);
	}
	col += hot * rays * 1.5 * (1.0 - anti) * flicker * Tc;

	// ---- antimatter: hollow dark core wrapped in a luminous membrane (analytic limb) ----
	float pulse = 1.0 + 0.12 * sin(wa(1.3 + 4.0 * turb) + seed * 6.0);
	float wob = 0.012 * sin(ang * 3.0 + spin * 2.0 + seed * 5.0);
	float u1 = (bdist - 0.31 - wob) * 46.0;
	float u2 = (bdist - 0.33 - wob) * 11.0;
	float membrane = exp(-u1 * u1) * 1.6 + exp(-u2 * u2) * 0.3;
	// faint inward-swirling wisps inside the void
	float inner = smoothstep(0.31, 0.12, bdist) * (0.5 + 0.5 * sin(ang * 2.0 - rr * 18.0 * sgn + spin * 3.0)) * 0.10;
	col *= 1.0 - 0.6 * voidM; // the hollow core swallows light
	col += anti * (hot * membrane * pulse + color * inner) * flicker;

	// ---- sparks: dashes swirling around the core (polar cells), tinted ----
	float sp = 0.0;
	for (int l = 0; l < 2; l++) {
		float fl2 = float(l);
		float N = 18.0 + 10.0 * fl2;
		float M = 6.0 + 3.0 * fl2;
		float a = fract((ang + wa(spinRate * (0.7 + 0.5 * fl2))) / TAU + fl2 * 0.37) * N;
		float rv = rr * M + fl2 * 0.5;
		vec2 cell = floor(vec2(a, rv));
		vec2 f = fract(vec2(a, rv));
		float h = hash12(cell + floor(seed * 37.0) + fl2 * 13.0);
		float h2 = hash12(cell.yx * 1.7 + 5.3 + fl2 * 7.0);
		vec2 o = vec2(0.25 + 0.5 * h2, 0.25 + 0.5 * fract(h * 7.3));
		float dx = (f.x - o.x) * (TAU / N) * rr;
		float dy = (f.y - o.y) / M;
		float Ld = 0.012 + 0.025 * fract(h * 13.1) * (0.5 + turb);
		float e = dx * dx / (Ld * Ld) + dy * dy / 0.00014;
		float on = step(0.82 - 0.1 * turb, h);
		float tw = 0.55 + 0.45 * sin(wa(1.2 + 6.0 * turb) * (0.7 + h2) + h2 * 40.0);
		sp += on * tw * exp(-e) * (0.5 + h);
	}
	sp *= smoothstep(0.98, 0.8, rr) * mix(1.0, smoothstep(0.3, 0.45, rr), anti);
	col += mix(color, vec3(1.0), 0.5) * sp * 0.7;

	// tone map: blend of hue-preserving and per-channel curves
	float cm = max(col.r, max(col.g, col.b));
	vec3 hueTM = col * (1.0 - exp(-cm * 1.2)) / max(cm, 1e-4);
	col = mix(hueTM, 1.0 - exp(-col * 1.2), 0.3);
	float alpha = 1.0 - T;
	alpha = max(alpha, voidM * 0.85); // the hollow core absorbs: dark, not see-through

	// ---- glass shell: saturated fresnel band + crisp inner rim line ----
	float fres = pow(1.0 - z, 3.0);
	float rimLine = smoothstep(0.90, 0.985, rr) * smoothstep(1.0, 0.985, rr);
	float rimVar = 0.75 + 0.5 * noise(vec3(cos(ang + wa(spinRate * 0.3)) * 1.6, sin(ang + wa(spinRate * 0.3)) * 1.6, seed * 9.0));
	vec3 rimC = mix(color, vec3(1.0), 0.25);
	col += (color * fres * 0.45 * rimVar + rimC * rimLine * 0.4) * (1.0 + 0.35 * anti);
	float ru = (rr - 0.885) * 34.0;
	col += hot * exp(-ru * ru) * 0.06; // faint refraction ring
	alpha = max(alpha, fres * 0.7);

	// ---- glass speculars: soft, large window reflection (all behind highlight) ----
	if (highlight > 0.5) {
		vec3 L = normalize(vec3(-0.5, 0.62, 0.6));
		vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
		float nh = max(dot(n, H), 0.0);
		float spec = pow(nh, 30.0) * 0.07;
		// curved window reflection hugging the upper-left rim
		float wu = (ang - 2.25) * rr / 0.24;
		float wv = (rr - 0.8) / 0.07;
		float win = smoothstep(1.0, 0.4, length(vec2(wu, wv)));
		// faint opposite bounce at the lower right
		float band2 = smoothstep(0.80, 0.9, rr) * smoothstep(0.97, 0.92, rr) * smoothstep(0.6, 0.0, abs(ang + 0.9));
		col += vec3(1.0) * (spec + win * 0.32) + hot * band2 * 0.2;
	}

	col = clamp(col, 0.0, 1.0);
	alpha = clamp(max(alpha, max(col.r, max(col.g, col.b))), 0.0, 1.0);
	vec4 inside = vec4(col, alpha);
	float cov = clamp((R - d) / px + 0.5, 0.0, 1.0);
	gl_FragColor = mix(outside, inside, cov);
}
`;
