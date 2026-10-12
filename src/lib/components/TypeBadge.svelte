<script lang="ts">
	import type { Force } from '#lib/physics/index.ts';

	let { force }: { force: Force } = $props();

	const names: Record<Force, string> = {
		strong: 'Strong',
		electromagnetic: 'Electric',
		weak: 'Weak',
		higgs: 'Higgs'
	};
</script>

<span class="badge" style:--f={`var(--${force})`}>{names[force]}</span>

<style>
	.badge {
		padding: 0.05rem 0.55rem;
		border-radius: 999px;
		background: var(--f);
		/* Force colours are dark in the light theme and light in the dark theme. */
		color: var(--bg);
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		white-space: nowrap;
	}
</style>
