<script lang="ts">
	import BalanceQuiz from '#lib/components/BalanceQuiz.svelte';
	import PuzzleBoard from '#lib/components/PuzzleBoard.svelte';
	import QuestList from '#lib/components/QuestList.svelte';
	import { SegmentedControl } from '#lib/ui/index.ts';

	type Tab = 'quests' | 'puzzles' | 'balance';
	const tabs: { value: Tab; label: string }[] = [
		{ value: 'quests', label: 'Quests' },
		{ value: 'puzzles', label: 'Puzzles' },
		{ value: 'balance', label: 'Balance' }
	];
	let tab = $state<Tab>('quests');

	const intros: Record<Tab, string> = {
		quests: 'Goals to reach in the Particle Lab. Each one ticks off the moment you make it happen.',
		puzzles:
			'A fixed set of particles and a target to make from them. Fewer moves earn more stars.',
		balance:
			'A real process with one product missing. Pick the particle that keeps charge, baryon number and every lepton number the same on both sides.'
	};
</script>

<svelte:head>
	<title>Challenges · The Standard Model</title>
</svelte:head>

<h1>Challenges</h1>
<div class="tabs">
	<SegmentedControl options={tabs} bind:value={tab} label="Challenge type" />
</div>
<p class="muted">{intros[tab]}</p>

{#if tab === 'quests'}
	<QuestList />
{:else if tab === 'puzzles'}
	<PuzzleBoard />
{:else}
	<BalanceQuiz />
{/if}

<style>
	.tabs {
		margin-bottom: var(--space-2);
	}
</style>
