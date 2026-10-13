<script lang="ts">
	import ParticleCard from '#lib/components/ParticleCard.svelte';
	import ParticleTile from '#lib/components/ParticleTile.svelte';
	import { resolve } from '$app/paths';
	import { getParticle, standardModelTable, type ElementaryParticle } from '#lib/physics/index.ts';

	let selectedId = $state('u');
	const selected = $derived(getParticle(selectedId));

	// The mirror table: each quark and lepton's antiparticle, in the same place. The
	// bosons are their own antiparticles (W⁺ and W⁻ already share the W± tile).
	const antiTable = standardModelTable.map((row) =>
		row.slice(0, 3).map((id) => (getParticle(id) as ElementaryParticle).antiparticleId)
	);

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
		Seventeen elementary particles (and their antiparticles) explain almost everything we know about
		matter and three of the four fundamental forces. Click a particle to learn about it, then head
		to the
		<a href={resolve('/lab')}>Particle Lab</a> to build protons, nuclei and atoms out of them.
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
		<h2 class="anti-head">Antimatter</h2>
		<p class="muted anti-note">
			Every quark and lepton has an antiparticle with the same mass and opposite charges. The gluon,
			photon, Z and Higgs are their own antiparticles; W⁺ and W⁻ are each other's.
		</p>
		<div class="table" role="list" aria-label="Antiparticles">
			{#each antiTable as row, r (r)}
				{#each row as id, c (id)}
					<div role="listitem" style:grid-row={r + 1} style:grid-column={c + 1}>
						<ParticleTile
							particle={getParticle(id)}
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

	<ParticleCard particle={selected} onselect={(id) => (selectedId = id)} />
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

	.anti-head {
		margin: 1.5rem 0 0.25rem;
		font-size: 1.1rem;
	}

	.anti-note {
		margin: 0 0 0.75rem;
		font-size: 0.85rem;
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
