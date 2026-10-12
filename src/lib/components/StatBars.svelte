<script lang="ts">
	import { ProgressBar } from '#lib/ui/index.ts';
	import { particleStats, type Particle } from '#lib/physics/index.ts';

	// The card's stat block: one bar per stat, what it means physically, and the total.
	// Bars take their colour from --c on an ancestor.

	let { particle }: { particle: Particle } = $props();

	const stats = $derived(particleStats(particle));
	const total = $derived(stats.reduce((sum, s) => sum + s.value, 0));
</script>

<dl class="stats">
	{#each stats as s (s.key)}
		<dt title={s.meaning}>{s.label}</dt>
		<dd title={s.meaning}>
			<ProgressBar value={s.value} label={s.label} />
			<span class="value">{s.value}</span>
			<span class="meaning">{s.meaning}</span>
		</dd>
	{/each}
	<dt>Total</dt>
	<dd><strong>{total}</strong></dd>
</dl>

<style>
	.stats {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25rem 0.75rem;
		margin: 0;
		align-items: center;
	}

	dt {
		align-self: start;
		font-weight: 600;
		font-size: 0.85rem;
		line-height: 1;
	}

	dd {
		display: grid;
		grid-template-columns: 1fr 2.2rem;
		align-items: center;
		gap: 0 0.5rem;
		margin: 0;
	}

	.value {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-size: 0.85rem;
	}

	.meaning {
		grid-column: 1 / -1;
		font-size: 0.72rem;
		opacity: 0.7;
	}
</style>
