<script lang="ts">
	import Equation from '#lib/components/Equation.svelte';
	import ParticleCard from '#lib/components/ParticleCard.svelte';
	import ParticleTile from '#lib/components/ParticleTile.svelte';
	import TypeBadge from '#lib/components/TypeBadge.svelte';
	import { resolve } from '$app/paths';
	import { BADGES, badgeProgress } from '#lib/game/collection.ts';
	import { game } from '#lib/game/store.svelte.ts';
	import { allParticles, getParticle, reactions } from '#lib/physics/index.ts';

	let selectedId = $state('u');
	const selected = $derived(getParticle(selectedId));
	const percent = $derived(Math.round((game.progress.found / game.progress.total) * 100));

	const groups = [
		{ label: 'Quarks', categories: ['quark'] },
		{ label: 'Leptons', categories: ['lepton'] },
		{ label: 'Bosons', categories: ['gauge-boson', 'scalar-boson'] },
		{ label: 'Hadrons', categories: ['hadron'] },
		{ label: 'Nuclei', categories: ['nucleus'] },
		{ label: 'Atoms', categories: ['atom'] }
	].map((g) => ({
		...g,
		particles: allParticles.filter((p) => g.categories.includes(p.category))
	}));

	function reset() {
		if (confirm('Reset your dex? Every discovered composite and reaction will be locked again.')) {
			game.reset();
			selectedId = 'u';
		}
	}
</script>

<svelte:head>
	<title>Particle Dex · The Standard Model</title>
</svelte:head>

<h1>Particle Dex</h1>
<p class="muted">
	Every elementary particle is yours from the start. Hadrons, nuclei and atoms join the dex the
	first time you build them in the <a href={resolve('/lab')}>Particle Lab</a>, and every reaction
	you run is recorded as a move.
</p>

<section class="panel progress">
	<div class="progress-head">
		<strong>{game.progress.found} / {game.progress.total} discovered</strong>
		<span class="muted">{percent}%</span>
	</div>
	<div
		class="bar"
		role="progressbar"
		aria-valuemin="0"
		aria-valuemax={game.progress.total}
		aria-valuenow={game.progress.found}
		aria-label="Dex progress"
	>
		<span style:width={`${percent}%`}></span>
	</div>

	<ul class="badges">
		{#each BADGES as badge (badge.id)}
			{@const p = badgeProgress(game.collection, badge)}
			<li class:earned={p.found === p.total}>
				<span class="medal" aria-hidden="true">{p.found === p.total ? '🏅' : '🔒'}</span>
				<div>
					<strong>{badge.name}</strong>
					<span class="muted">{badge.description} {p.found}/{p.total}</span>
				</div>
			</li>
		{/each}
	</ul>
</section>

<div class="layout">
	<div>
		{#each groups as group (group.label)}
			<h2>{group.label}</h2>
			<div class="grid">
				{#each group.particles as p (p.id)}
					<ParticleTile
						particle={p}
						compact
						locked={!game.isDiscovered(p.id)}
						selected={selectedId === p.id}
						onclick={() => (selectedId = p.id)}
					/>
				{/each}
			</div>
		{/each}

		<h2>Moves</h2>
		<ul class="moves">
			{#each reactions as r (r.id)}
				<li class="panel" class:locked={!game.collection.reactions.includes(r.id)}>
					{#if game.collection.reactions.includes(r.id)}
						<div class="move-head"><strong>{r.name}</strong><TypeBadge force={r.force} /></div>
						<Equation inputs={r.inputs} outputs={r.outputs} />
					{:else}
						<div class="move-head"><strong>???</strong><TypeBadge force={r.force} /></div>
						<span class="muted">
							Undiscovered. It starts from {r.inputs.length === 1
								? 'one particle'
								: `${r.inputs.length} particles`}.
						</span>
					{/if}
				</li>
			{/each}
		</ul>

		<button type="button" class="btn reset" onclick={reset}>Reset progress</button>
	</div>

	<div class="side">
		<ParticleCard particle={selected} onselect={(id) => (selectedId = id)} />
	</div>
</div>

<style>
	.progress {
		display: grid;
		gap: 0.6rem;
		margin-bottom: 1.5rem;
	}

	.progress-head {
		display: flex;
		justify-content: space-between;
	}

	.bar {
		height: 0.7rem;
		border-radius: 999px;
		background: var(--surface-2);
		overflow: hidden;
	}

	.bar span {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, var(--quark), var(--lepton), var(--electromagnetic));
		transition: width 0.6s ease-out;
	}

	.badges {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.badges li {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem 0.7rem;
		border: 1px dashed var(--border);
		border-radius: 10px;
		opacity: 0.75;
	}

	.badges li.earned {
		border-style: solid;
		border-color: var(--electromagnetic);
		opacity: 1;
	}

	.badges div {
		display: grid;
		font-size: 0.85rem;
	}

	.medal {
		font-size: 1.6rem;
	}

	.layout {
		display: grid;
		grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
		gap: 1.5rem;
		align-items: start;
	}

	.side {
		position: sticky;
		top: 1rem;
	}

	h2 {
		margin: 1.2rem 0 0.5rem;
		font-size: 1rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(4rem, 1fr));
		gap: 0.4rem;
	}

	.moves {
		display: grid;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.moves li.locked {
		border-style: dashed;
		background: var(--surface-2);
	}

	.move-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.reset {
		margin-top: 1.5rem;
	}

	@media (max-width: 760px) {
		.layout {
			grid-template-columns: 1fr;
		}

		.side {
			position: static;
		}
	}
</style>
