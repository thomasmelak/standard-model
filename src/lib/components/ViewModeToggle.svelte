<script lang="ts" module>
	export type ViewMode = 'orb' | 'parts' | 'fundamental';
</script>

<script lang="ts">
	import { SegmentedControl } from '#lib/ui/index.ts';
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
	<SegmentedControl {options} bind:value={mode} label="Show" />
{/if}
