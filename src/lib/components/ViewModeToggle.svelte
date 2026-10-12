<script lang="ts" module>
	export type ViewMode = 'orb' | 'parts' | 'fundamental';
</script>

<script lang="ts">
	import { getParticle, type Particle } from '#lib/physics/index.ts';

	// Orb / Parts / Quarks & leptons switch for composite particles. Hidden for
	// elementary ones, which have no parts. The last option only appears when it
	// differs from "Parts" (a nucleus is made of nucleons, which are made of quarks).

	let { particle, mode = $bindable() }: { particle: Particle; mode: ViewMode } = $props();

	const deep = $derived(
		!particle.elementary && particle.constituents.some((id) => !getParticle(id).elementary)
	);

	const options = $derived<{ value: ViewMode; label: string }[]>([
		{ value: 'orb', label: 'Orb' },
		{ value: 'parts', label: 'Parts' },
		...(deep ? [{ value: 'fundamental' as const, label: 'Quarks & leptons' }] : [])
	]);

	// A particle without the current view (e.g. after switching to an electron) falls back to the orb.
	$effect(() => {
		if (!particle.elementary && !options.some((o) => o.value === mode)) mode = 'orb';
		if (particle.elementary && mode !== 'orb') mode = 'orb';
	});
</script>

{#if !particle.elementary}
	<div class="toggle" role="radiogroup" aria-label="Show">
		{#each options as o (o.value)}
			<button
				type="button"
				role="radio"
				aria-checked={mode === o.value}
				class:on={mode === o.value}
				onclick={() => (mode = o.value)}>{o.label}</button
			>
		{/each}
	</div>
{/if}

<style>
	.toggle {
		display: inline-flex;
		padding: 2px;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.45);
		border: 1px solid rgb(255 255 255 / 0.15);
	}

	button {
		padding: 0.15rem 0.6rem;
		border: none;
		border-radius: 999px;
		background: none;
		color: rgb(255 255 255 / 0.75);
		font-size: 0.75rem;
	}

	button.on {
		background: rgb(255 255 255 / 0.18);
		color: white;
	}
</style>
