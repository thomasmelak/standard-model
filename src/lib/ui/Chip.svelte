<script lang="ts">
	import type { Snippet } from 'svelte';

	// A small pill, usually an orb plus a symbol. Clickable when given `onclick`;
	// `locked` draws it dashed and quiet (an undiscovered particle).

	interface Props {
		onclick?: () => void;
		locked?: boolean;
		title?: string;
		children?: Snippet;
	}

	let { onclick, locked = false, title, children }: Props = $props();
</script>

{#if onclick && !locked}
	<button type="button" class="chip" {title} {onclick}>{@render children?.()}</button>
{:else}
	<span class="chip" class:locked {title}>{@render children?.()}</span>
{/if}

<style>
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.1rem 0.55rem 0.1rem 0.2rem;
		border: 1px solid var(--glass-line);
		border-radius: var(--radius-pill);
		background: linear-gradient(135deg, var(--glass-tint), var(--glass-tint-2));
		box-shadow: inset 0 1px 0 var(--glass-edge);
		font-size: 0.85rem;
	}

	button.chip:hover,
	button.chip:focus-visible {
		border-color: var(--accent);
	}

	.locked {
		padding: 0.1rem 0.6rem;
		border-style: dashed;
		background: none;
		box-shadow: none;
		color: var(--muted);
		cursor: help;
	}
</style>
