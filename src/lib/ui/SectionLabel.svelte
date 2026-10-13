<script lang="ts">
	import type { Snippet } from 'svelte';

	// The small uppercase heading over a group in a card ("Stats", "Moves", …).

	let { as = 'h3', children }: { as?: 'h2' | 'h3' | 'h4'; children?: Snippet } = $props();
</script>

<svelte:element this={as} class="label">{@render children?.()}</svelte:element>

<style>
	.label {
		margin: 0 0 var(--space-2);
		font-family: var(--font-display);
		font-size: 0.7rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted);
	}
</style>
