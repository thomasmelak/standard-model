<script lang="ts">
	import ParticleDetails from '#lib/components/ParticleDetails.svelte';
	import ParticleTile from '#lib/components/ParticleTile.svelte';
	import { resolve } from '$app/paths';
	import { getParticle, standardModelTable } from '#lib/physics/index.ts';

	let selectedId = $state('u');
	const selected = $derived(getParticle(selectedId));

	const legend = [
		{ category: 'quark', label: 'Quarks' },
		{ category: 'lepton', label: 'Leptons' },
		{ category: 'gauge-boson', label: 'Gauge bosons' },
		{ category: 'scalar-boson', label: 'Scalar boson' }
	];
</script>

<section class="intro">
	<h1>The Standard Model of particle physics</h1>
	<p class="muted">
		Seventeen elementary particles explain almost everything we know about matter and three of the
		four fundamental forces. Click a particle to learn about it, or see
		<a href={resolve('/interactions')}>how the forces act on each one</a>.
	</p>
</section>

<div class="layout">
	<div>
		<div class="table" role="list">
			{#each standardModelTable as row, r (r)}
				{#each row as id, c (id)}
					<div
						role="listitem"
						class:higgs={id === 'H'}
						style:grid-row={id === 'H' ? '1 / span 2' : r + 1}
						style:grid-column={c + 1}
					>
						<ParticleTile
							particle={getParticle(id)}
							label={id === 'W+' ? 'W±' : undefined}
							selected={selectedId === id}
							onclick={() => (selectedId = id)}
						/>
					</div>
				{/each}
			{/each}
		</div>
		<ul class="legend">
			{#each legend as item (item.category)}
				<li style:--c={`var(--${item.category})`}>{item.label}</li>
			{/each}
		</ul>
	</div>

	<ParticleDetails particle={selected} />
</div>

<style>
	.intro {
		max-width: 70ch;
	}

	.layout {
		display: grid;
		grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
		gap: 1.5rem;
		align-items: start;
	}

	.table {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 0.5rem;
	}

	/* The Higgs sits alone in the fifth column, spanning two rows. */
	.higgs {
		display: flex;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		padding: 0;
		list-style: none;
		font-size: 0.85rem;
	}

	.legend li::before {
		content: '';
		display: inline-block;
		width: 0.7rem;
		height: 0.7rem;
		margin-right: 0.35rem;
		border-radius: 3px;
		background: var(--c);
	}

	@media (max-width: 760px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
