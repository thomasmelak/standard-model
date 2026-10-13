<script lang="ts">
	import ParticleChip from './ParticleChip.svelte';
	import TypeBadge from './TypeBadge.svelte';
	import { getParticle, particleInteractions, type Particle } from '#lib/physics/index.ts';

	// Who a particle interacts with, force by force, and through which carrier.

	let { particle, onselect }: { particle: Particle; onselect?: (id: string) => void } = $props();

	const interactions = $derived(particleInteractions(particle));
</script>

{#each interactions as i (i.force)}
	<div class="interaction">
		<div class="via">
			<TypeBadge force={i.force} />
			<span class="muted"
				>via {i.carriers
					.map((id) => (id === 'W+' ? 'W±' : getParticle(id).symbol))
					.join(', ')}</span
			>
		</div>
		<div class="chips">
			{#each i.partners as id (id)}
				<ParticleChip {id} {onselect} />
			{/each}
		</div>
	</div>
{:else}
	<p class="muted">Nothing — it is bound up inside the composites it forms.</p>
{/each}

<style>
	.interaction {
		display: grid;
		gap: 0.3rem;
		margin-bottom: 0.5rem;
	}

	.via {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
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
