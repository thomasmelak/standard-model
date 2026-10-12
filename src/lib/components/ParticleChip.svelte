<script lang="ts">
	import Orb from './Orb.svelte';
	import ParticleSymbol from './ParticleSymbol.svelte';
	import { hint } from '#lib/game/collection.ts';
	import { game } from '#lib/game/store.svelte.ts';
	import { getParticle } from '#lib/physics/index.ts';
	import { Chip } from '#lib/ui/index.ts';

	// A particle as a chip: its orb and symbol, or a locked "?" until it's discovered.

	let { id, onselect }: { id: string; onselect?: (id: string) => void } = $props();

	const p = $derived(getParticle(id));
</script>

{#if game.isDiscovered(id)}
	<Chip title={p.name} onclick={onselect ? () => onselect(id) : undefined}>
		<Orb particle={p} size={16} />
		<span><ParticleSymbol symbol={p.symbol} /></span>
	</Chip>
{:else}
	<Chip locked title="Undiscovered. {hint(p)}">?</Chip>
{/if}
