<script lang="ts">
	import Equation from '#lib/components/Equation.svelte';
	import ParticleDetails from '#lib/components/ParticleDetails.svelte';
	import ParticleTile from '#lib/components/ParticleTile.svelte';
	import {
		allParticles,
		checkConservation,
		combine,
		findReaction,
		formatFraction,
		getParticle,
		sumQuantumNumbers,
		type ConservationCheck,
		type Particle
	} from '#lib/physics/index.ts';

	interface BenchItem {
		key: number;
		id: string;
	}

	interface LogEntry {
		key: number;
		title: string;
		detail: string;
		inputs: string[];
		/** Undefined when nothing formed. */
		outputs?: string[];
		checks?: ConservationCheck[];
		ok: boolean;
	}

	let nextKey = 0;
	let showAntiparticles = $state(false);
	let bench = $state<BenchItem[]>([]);
	let inspectedId = $state<string | undefined>();
	let log = $state<LogEntry[]>([]);

	const benchIds = $derived(bench.map((item) => item.id));
	const totals = $derived(sumQuantumNumbers(benchIds));
	const composite = $derived(benchIds.length > 1 ? combine(benchIds) : undefined);
	const reaction = $derived(benchIds.length ? findReaction(benchIds) : undefined);
	const splittable = $derived(bench.length === 1 && !getParticle(bench[0].id).elementary);

	const isAnti = (p: Particle) =>
		p.baryon3 < 0 || p.leptonE + p.leptonMu + p.leptonTau < 0 || p.id === 'W-';

	const headings = {
		quark: 'Quarks',
		lepton: 'Leptons',
		'gauge-boson': 'Bosons',
		hadron: 'Hadrons',
		nucleus: 'Nuclei',
		atom: 'Atoms'
	} as const;

	const palette = $derived(
		(['quark', 'lepton', 'gauge-boson', 'hadron', 'nucleus', 'atom'] as const).map((category) => ({
			category,
			particles: allParticles.filter(
				(p) =>
					(p.category === category ||
						(category === 'gauge-boson' && p.category === 'scalar-boson')) &&
					(showAntiparticles || !isAnti(p))
			)
		}))
	);

	function setBench(ids: string[]) {
		bench = ids.map((id) => ({ key: nextKey++, id }));
	}

	function record(entry: Omit<LogEntry, 'key'>) {
		log = [{ key: nextKey++, ...entry }, ...log].slice(0, 20);
	}

	function add(id: string) {
		bench = [...bench, { key: nextKey++, id }];
		inspectedId = id;
	}

	function remove(key: number) {
		bench = bench.filter((item) => item.key !== key);
	}

	function doCombine() {
		const ids = benchIds;
		// Read once: `composite` is derived from the bench, which setBench replaces.
		const formed = composite;
		if (formed) {
			record({
				title: `Formed a ${formed.name}`,
				detail: `Bound together by the ${formed.boundBy} force.`,
				inputs: ids,
				outputs: [formed.id],
				ok: true
			});
			setBench([formed.id]);
			inspectedId = formed.id;
			return;
		}
		record({
			title: 'No bound state',
			detail: explainFailure(ids),
			inputs: ids,
			ok: false
		});
	}

	function explainFailure(ids: string[]): string {
		const q = sumQuantumNumbers(ids);
		if (q.baryon3 % 3 !== 0) {
			return 'Colour confinement: quarks only exist in colour-neutral groups — three quarks (a baryon) or a quark and an antiquark (a meson).';
		}
		if (ids.some((id) => getParticle(id).category === 'gauge-boson')) {
			return 'Force carriers are exchanged between particles; they are not building blocks of matter.';
		}
		return 'This combination is not one of the bound states in the lab yet. Try u+u+d, p+n or p+e⁻.';
	}

	function doSplit() {
		const id = bench[0].id;
		const particle = getParticle(id);
		if (particle.elementary) return;
		const parts = particle.constituents;
		record({
			title: `Split a ${particle.name}`,
			detail:
				particle.category === 'hadron'
					? 'In reality quarks cannot be pulled apart: the energy needed creates new quark–antiquark pairs instead.'
					: `Overcoming the ${particle.boundBy} binding energy frees the constituents.`,
			inputs: [id],
			outputs: parts,
			ok: true
		});
		setBench(parts);
	}

	function doReact() {
		if (!reaction) return;
		const checks = checkConservation(reaction.inputs, reaction.outputs);
		const mediator = reaction.mediator
			? ` via a virtual ${getParticle(reaction.mediator).symbol}`
			: '';
		record({
			title: reaction.name,
			detail: `${reaction.description} (${reaction.force} interaction${mediator})`,
			inputs: reaction.inputs,
			outputs: reaction.outputs,
			checks,
			ok: checks.every((c) => c.conserved)
		});
		setBench(reaction.outputs);
	}
</script>

<h1>Particle Lab</h1>
<p class="muted">
	Click particles to place them on the workbench. Combine quarks into hadrons, hadrons into nuclei
	and nuclei with electrons into atoms — or split them back apart and run decays to watch the
	conservation laws at work.
</p>

<div class="layout">
	<section class="panel palette">
		<header>
			<h2>Particles</h2>
			<label><input type="checkbox" bind:checked={showAntiparticles} /> Antiparticles</label>
		</header>
		{#each palette as group (group.category)}
			<h3>{headings[group.category]}</h3>
			<div class="grid">
				{#each group.particles as p (p.id)}
					<ParticleTile particle={p} compact onclick={() => add(p.id)} />
				{/each}
			</div>
		{/each}
	</section>

	<div class="right">
		<section class="panel">
			<h2>Workbench</h2>
			<div class="bench" aria-live="polite">
				{#each bench as item (item.key)}
					<div class="bench-item">
						<ParticleTile
							particle={getParticle(item.id)}
							selected={inspectedId === item.id}
							onclick={() => (inspectedId = item.id)}
						/>
						<button
							type="button"
							class="remove"
							aria-label="Remove {getParticle(item.id).name}"
							onclick={() => remove(item.key)}>×</button
						>
					</div>
				{:else}
					<p class="muted">Empty — pick some particles. Try two up quarks and a down quark.</p>
				{/each}
			</div>

			<p class="totals">
				Charge <strong>{formatFraction(totals.charge3, 3)}</strong> · Baryon number
				<strong>{formatFraction(totals.baryon3, 3)}</strong> · Lepton number
				<strong>{formatFraction(totals.leptonE + totals.leptonMu + totals.leptonTau)}</strong>
			</p>

			<div class="actions">
				<button type="button" class="btn primary" disabled={bench.length < 2} onclick={doCombine}>
					Combine{composite ? ` → ${composite.symbol}` : ''}
				</button>
				<button type="button" class="btn" disabled={!splittable} onclick={doSplit}>Split</button>
				<button type="button" class="btn" disabled={!reaction} onclick={doReact}>
					{reaction ? reaction.name : 'React'}
				</button>
				<button type="button" class="btn" disabled={!bench.length} onclick={() => setBench([])}>
					Clear
				</button>
			</div>
		</section>

		{#if inspectedId}
			<ParticleDetails particle={getParticle(inspectedId)} />
		{/if}

		{#if log.length}
			<section class="panel">
				<h2>Lab notebook</h2>
				<ol class="log">
					{#each log as entry (entry.key)}
						<li class:bad={!entry.ok}>
							<strong>{entry.title}</strong>
							<div class="equation"><Equation inputs={entry.inputs} outputs={entry.outputs} /></div>
							<div class="muted">{entry.detail}</div>
							{#if entry.checks}
								<table>
									<tbody>
										{#each entry.checks as c (c.label)}
											<tr>
												<td>{c.label}</td>
												<td
													>{formatFraction(c.before, c.scale)} → {formatFraction(
														c.after,
														c.scale
													)}</td
												>
												<td class:ok={c.conserved}>{c.conserved ? '✓ conserved' : '✗ violated'}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							{/if}
						</li>
					{/each}
				</ol>
			</section>
		{/if}
	</div>
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
		gap: 1.5rem;
		align-items: start;
	}

	.right {
		display: grid;
		gap: 1rem;
	}

	.palette header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	h2 {
		margin: 0 0 0.75rem;
	}

	h3 {
		margin: 1rem 0 0.4rem;
		font-size: 0.85rem;
		color: var(--muted);
		text-transform: capitalize;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(4rem, 1fr));
		gap: 0.4rem;
	}

	.bench {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
		gap: 0.5rem;
		min-height: 7rem;
	}

	.bench-item {
		position: relative;
	}

	.remove {
		position: absolute;
		top: 0.2rem;
		right: 0.3rem;
		border: none;
		background: none;
		color: var(--muted);
		font-size: 1rem;
	}

	.totals {
		font-size: 0.9rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.log {
		display: grid;
		gap: 0.75rem;
		padding: 0;
		margin: 0;
		list-style: none;
	}

	.log li {
		padding-left: 0.75rem;
		border-left: 3px solid var(--ok);
	}

	.log li.bad {
		border-color: var(--bad);
	}

	.equation {
		font-size: 1.15rem;
	}

	table {
		margin-top: 0.4rem;
		font-size: 0.8rem;
		border-collapse: collapse;
	}

	td {
		padding: 0.1rem 0.75rem 0.1rem 0;
	}

	td.ok {
		color: var(--ok);
	}

	@media (max-width: 760px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
