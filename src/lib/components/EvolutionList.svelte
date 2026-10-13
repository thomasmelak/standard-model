<script lang="ts">
	import ParticleChip from './ParticleChip.svelte';
	import { particleEvolution, type Particle } from '#lib/physics/index.ts';

	// What a particle is made from, and which composites it fuses into.

	let { particle, onselect }: { particle: Particle; onselect?: (id: string) => void } = $props();

	const evolution = $derived(particleEvolution(particle));
</script>

{#if evolution.from}
	<div class="evo">
		<span class="muted">Made from</span>
		<div class="chips">
			{#each evolution.from as id, i (i)}
				<ParticleChip {id} {onselect} />
			{/each}
		</div>
	</div>
{/if}
{#if evolution.into.length}
	<div class="evo">
		<span class="muted">Fuses into</span>
		<div class="chips">
			{#each evolution.into as c (c.id)}
				<ParticleChip id={c.id} {onselect} />
			{/each}
		</div>
	</div>
{/if}
{#if !evolution.from && !evolution.into.length}
	<p class="muted">Nothing is made from it, and it isn't made of anything.</p>
{/if}

<style>
	.evo {
		display: grid;
		gap: 0.3rem;
		margin-bottom: 0.5rem;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	p {
		margin: 0;
	}
</style>
