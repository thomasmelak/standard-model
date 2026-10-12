<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	// The design system's surface: a frosted pane of glass. Everything that used to
	// be a "panel" is one of these. See docs/DESIGN_SYSTEM.md.

	interface Props extends HTMLAttributes<HTMLElement> {
		/** Element to render, for the right semantics. */
		as?: 'div' | 'section' | 'article' | 'aside' | 'li' | 'header';
		/** A colour the glass is tinted and lit with, e.g. `var(--quark)`. */
		glow?: string;
		/** Featured cards: a glowing glint circles the rim and a sheen sweeps across. */
		shine?: boolean;
		/** Dashed, flat and dimmed: something not unlocked or not available yet. */
		ghost?: boolean;
		padding?: 'none' | 'sm' | 'md' | 'lg';
		children?: Snippet;
	}

	let {
		as = 'div',
		glow,
		shine = false,
		ghost = false,
		padding = 'md',
		class: className = '',
		style = '',
		children,
		...rest
	}: Props = $props();
</script>

<svelte:element
	this={as}
	class="glass pad-{padding} {className}"
	class:glow={!!glow}
	class:shine
	class:ghost
	style="{glow ? `--glow: ${glow};` : ''}{style}"
	{...rest}
>
	{@render children?.()}
</svelte:element>

<style>
	.glass {
		position: relative;
		isolation: isolate;
		border: 1px solid var(--glass-line);
		border-radius: var(--radius-lg);
		background:
			radial-gradient(120% 70% at 0% 0%, var(--glass-reflection), transparent 55%),
			linear-gradient(135deg, var(--glass-tint), var(--glass-tint-2));
		-webkit-backdrop-filter: blur(var(--blur-glass)) saturate(140%);
		backdrop-filter: blur(var(--blur-glass)) saturate(140%);
		box-shadow:
			inset 0 1px 0 var(--glass-edge),
			var(--glass-shadow);
	}

	.pad-none {
		padding: 0;
	}

	.pad-sm {
		padding: var(--space-2) var(--space-3);
	}

	.pad-md {
		padding: var(--space-4);
	}

	.pad-lg {
		padding: var(--space-5);
	}

	/* Tinted by a colour: the edge, the far corner and a soft outer glow pick it up. */
	.glow {
		border-color: color-mix(in srgb, var(--glow) 45%, var(--glass-line));
		background:
			radial-gradient(120% 70% at 0% 0%, var(--glass-reflection), transparent 55%),
			linear-gradient(
				135deg,
				var(--glass-tint),
				var(--glass-tint-2) 45%,
				color-mix(in srgb, var(--glow) 14%, transparent)
			);
		box-shadow:
			inset 0 1px 0 var(--glass-edge),
			var(--glass-shadow),
			0 0 28px color-mix(in srgb, var(--glow) 20%, transparent);
	}

	.ghost {
		border-style: dashed;
		background: var(--surface-2);
		box-shadow: none;
		-webkit-backdrop-filter: none;
		backdrop-filter: none;
		opacity: 0.8;
	}

	/* The rim of a shining card: a 2px gradient ring, masked to the border, with a
	   bright glint that circles it. The prefixed properties come first so the CSS
	   minifier keeps the standard ones. */
	.shine {
		overflow: hidden;
	}

	.shine::before {
		content: '';
		position: absolute;
		inset: -1px;
		z-index: 1;
		padding: 2px;
		border-radius: inherit;
		background: conic-gradient(
			from var(--glint),
			rgb(255 255 255 / 0.12),
			rgb(255 255 255 / 0.6) 4%,
			white 9%,
			color-mix(in srgb, var(--glow, white) 50%, white) 13%,
			rgb(255 255 255 / 0.12) 22%,
			rgb(255 255 255 / 0.12) 48%,
			rgb(255 255 255 / 0.7) 55%,
			rgb(255 255 255 / 0.12) 64%
		);
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
		filter: drop-shadow(0 0 2px rgb(255 255 255 / 0.9))
			drop-shadow(0 0 6px color-mix(in srgb, var(--glow, white) 80%, white));
		animation: glint 6s linear infinite;
		pointer-events: none;
	}

	/* …and a sheen that sweeps across the surface now and then. */
	.shine::after {
		content: '';
		position: absolute;
		inset: -50% -60%;
		z-index: 1;
		background: linear-gradient(
			115deg,
			transparent 42%,
			rgb(255 255 255 / 0.1) 49%,
			rgb(255 255 255 / 0.18) 50%,
			rgb(255 255 255 / 0.1) 51%,
			transparent 58%
		);
		transform: translateX(-60%);
		animation: sheen 7s ease-in-out infinite;
		pointer-events: none;
	}

	@property --glint {
		syntax: '<angle>';
		inherits: false;
		initial-value: 0deg;
	}

	@keyframes glint {
		to {
			--glint: 360deg;
		}
	}

	@keyframes sheen {
		0%,
		60% {
			transform: translateX(-60%);
		}
		100% {
			transform: translateX(60%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.shine::before,
		.shine::after {
			animation: none;
		}
	}
</style>
