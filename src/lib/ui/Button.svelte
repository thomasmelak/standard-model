<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	// The one button. `icon` makes a round button for a single glyph (✕ ‹ › ⤢ ☾);
	// give those an aria-label.

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		icon?: boolean;
		children?: Snippet;
	}

	let {
		variant = 'secondary',
		size = 'md',
		icon = false,
		type = 'button',
		class: className = '',
		children,
		...rest
	}: Props = $props();
</script>

<button {type} class="btn {variant} {size} {className}" class:icon {...rest}>
	{@render children?.()}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		border: 1px solid var(--glass-line);
		border-radius: var(--radius-sm);
		line-height: 1.2;
		transition:
			border-color 0.15s,
			background 0.15s,
			transform 0.1s;
	}

	.btn:active:not(:disabled) {
		transform: scale(0.97);
	}

	.btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.btn:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.sm {
		padding: var(--space-1) var(--space-2);
		font-size: 0.85rem;
	}

	.md {
		padding: 0.45rem 0.9rem;
	}

	.lg {
		padding: var(--space-3) var(--space-5);
		font-size: 1.05rem;
	}

	.primary {
		border-color: var(--accent-strong);
		background: var(--accent-strong);
		color: var(--on-accent);
	}

	.primary:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	/* A small pane of glass. */
	.secondary {
		background: linear-gradient(135deg, var(--glass-tint), var(--glass-tint-2));
		box-shadow: inset 0 1px 0 var(--glass-edge);
		-webkit-backdrop-filter: blur(8px);
		backdrop-filter: blur(8px);
	}

	.secondary:hover:not(:disabled),
	.ghost:hover:not(:disabled) {
		border-color: var(--accent);
	}

	.ghost {
		border-color: transparent;
		background: none;
		color: var(--muted);
	}

	.ghost:hover:not(:disabled) {
		color: var(--text);
	}

	.icon {
		padding: 0;
		border-radius: 50%;
		line-height: 1;
	}

	.icon.sm {
		width: 1.6rem;
		height: 1.6rem;
		font-size: 0.85rem;
	}

	.icon.md {
		width: 2.25rem;
		height: 2.25rem;
		font-size: 1rem;
	}

	.icon.lg {
		width: 3rem;
		height: 3rem;
		font-size: 1.6rem;
	}
</style>
