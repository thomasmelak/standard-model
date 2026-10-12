<script lang="ts">
	import Equation from '#lib/components/Equation.svelte';
	import ParticleSymbol from '#lib/components/ParticleSymbol.svelte';
	import {
		getParticle,
		reactions,
		standardModelTable,
		type ElementaryParticle,
		type Force
	} from '#lib/physics/index.ts';

	const forces: {
		force: Force;
		carrier: string;
		strength: string;
		range: string;
		summary: string;
	}[] = [
		{
			force: 'strong',
			carrier: 'g',
			strength: '1',
			range: '10⁻¹⁵ m',
			summary:
				'Binds quarks into hadrons and, as a residual effect, protons and neutrons into nuclei.'
		},
		{
			force: 'electromagnetic',
			carrier: 'gamma',
			strength: '1/137',
			range: 'infinite',
			summary: 'Acts on electric charge. Binds electrons to nuclei and atoms into molecules.'
		},
		{
			force: 'weak',
			carrier: 'W+',
			strength: '10⁻⁶',
			range: '10⁻¹⁸ m',
			summary:
				'The only force that changes particle flavour, driving radioactive beta decay and fusion in the Sun.'
		},
		{
			force: 'higgs',
			carrier: 'H',
			strength: '∝ mass',
			range: '10⁻¹⁸ m',
			summary: 'Coupling to the Higgs field gives fundamental particles their rest mass.'
		}
	];

	// Column by column: each generation's quarks and leptons, then the bosons.
	const particles = [0, 1, 2, 3, 4].flatMap((c) =>
		standardModelTable
			.flatMap((row) => (row[c] ? [getParticle(row[c])] : []))
			.filter((p): p is ElementaryParticle => p.elementary)
	);
</script>

<h1>The fundamental interactions</h1>
<p class="muted">
	Each force is carried by a boson. Whether a particle feels a force depends on whether it has the
	matching charge: colour for the strong force, electric charge for electromagnetism, and weak
	isospin for the weak force.
</p>

<div class="forces">
	{#each forces as f (f.force)}
		<section class="panel" style:--f={`var(--${f.force})`}>
			<h2>{f.force}</h2>
			<p>{f.summary}</p>
			<p class="muted">
				Carrier: <strong>{getParticle(f.carrier).name}</strong> · Relative strength: {f.strength}
				· Range: {f.range}
			</p>
		</section>
	{/each}
</div>

<h2>Who feels what</h2>
<div class="scroll">
	<table>
		<thead>
			<tr>
				<th>Particle</th>
				{#each forces as f (f.force)}
					<th style:color={`var(--${f.force})`}>{f.force}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each particles as p (p.id)}
				<tr>
					<td
						><strong><ParticleSymbol symbol={p.symbol} /></strong>
						<span class="name">{p.name}</span></td
					>
					{#each forces as f (f.force)}
						<td class="cell">{p.forces.includes(f.force) ? '●' : ''}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<h2>Example processes</h2>
<ul class="reactions">
	{#each reactions as r (r.id)}
		<li class="panel" style:--f={`var(--${r.force})`}>
			<strong>{r.name}</strong>
			<div class="equation"><Equation inputs={r.inputs} outputs={r.outputs} /></div>
			<span class="muted">{r.description}</span>
		</li>
	{/each}
</ul>

<style>
	.forces {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
		gap: 1rem;
	}

	.forces section,
	.reactions li {
		border-left: 4px solid var(--f);
	}

	.forces h2 {
		margin-top: 0;
		text-transform: capitalize;
		color: var(--f);
	}

	.scroll {
		overflow-x: auto;
	}

	table {
		border-collapse: collapse;
		min-width: 100%;
	}

	th,
	td {
		padding: 0.4rem 0.75rem;
		border-bottom: 1px solid var(--border);
		text-align: left;
	}

	th,
	.name {
		text-transform: capitalize;
	}

	.cell {
		text-align: center;
	}

	.reactions {
		display: grid;
		gap: 0.75rem;
		padding: 0;
		list-style: none;
	}

	.equation {
		font-size: 1.2rem;
		margin: 0.25rem 0;
	}
</style>
