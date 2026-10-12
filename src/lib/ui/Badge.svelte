<script lang="ts">
	import type { Snippet } from 'svelte';

	// A solid, uppercase label in a colour, e.g. a force type.

	let { color, children }: { color: string; children?: Snippet } = $props();
</script>

<span class="badge" style:--badge={color}>{@render children?.()}</span>

<style>
	.badge {
		padding: 0.05rem 0.55rem;
		border-radius: var(--radius-pill);
		background: var(--badge);
		/* Theme colours are dark in the light theme and light in the dark theme. */
		color: var(--bg);
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		white-space: nowrap;
	}
</style>
