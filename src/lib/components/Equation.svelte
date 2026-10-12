<script lang="ts">
	import ParticleSymbol from './ParticleSymbol.svelte';
	import { getParticle } from '#lib/physics/index.ts';

	let { inputs, outputs }: { inputs: string[]; outputs?: string[] } = $props();
</script>

{#snippet side(ids: string[])}
	{#each ids as id, i (i)}
		{#if i > 0}&nbsp;+&nbsp;{/if}<ParticleSymbol symbol={getParticle(id).symbol} />
	{/each}
{/snippet}

<span class="equation">
	{@render side(inputs)} →
	{#if outputs}{@render side(outputs)}{:else}?{/if}
</span>
