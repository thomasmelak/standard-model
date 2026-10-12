<script lang="ts">
	import ParticleStage from './ParticleStage.svelte';
	import ParticleSymbol from './ParticleSymbol.svelte';
	import StatBars from './StatBars.svelte';
	import TypeBadge from './TypeBadge.svelte';
	import { game } from '#lib/game/store.svelte.ts';
	import ViewModeToggle, { type ViewMode } from './ViewModeToggle.svelte';
	import {
		dexNumber,
		formatFraction,
		formatMass,
		formatSpin,
		allParticles,
		particleTypes,
		type Particle
	} from '#lib/physics/index.ts';

	// Full-screen view of one particle: a large live orb (or its parts) on a dark
	// stage. Opens as a modal dialog and, where the browser allows, true full screen.

	interface Props {
		particle: Particle;
		open: boolean;
		mode: ViewMode;
		onselect?: (id: string) => void;
	}

	let { particle, open = $bindable(), mode = $bindable(), onselect }: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	let width = $state(1024);
	let height = $state(768);

	// Side by side (orb | stats) on wide screens, stacked on narrow ones.
	const wide = $derived(width >= 900);
	// Leave room for the header, caption, arrows and (when wide) the stats column.
	const stageSize = $derived(
		Math.max(220, Math.min(width - (wide ? 480 : 168), height - (wide ? 220 : 320), 720))
	);

	// Arrows and ←/→ step through the discovered particles in dex order, wrapping around.
	const sequence = $derived(allParticles.filter((p) => game.isDiscovered(p.id)));
	const index = $derived(sequence.findIndex((p) => p.id === particle.id));
	const canStep = $derived(Boolean(onselect) && sequence.length > 1 && index >= 0);
	const prev = $derived(canStep ? sequence.at(index - 1) : undefined);
	const next = $derived(canStep ? sequence[(index + 1) % sequence.length] : undefined);

	function step(to: Particle | undefined) {
		if (to) onselect?.(to.id);
	}

	function onkeydown(e: KeyboardEvent) {
		if (!open || e.altKey || e.ctrlKey || e.metaKey) return;
		if (e.key === 'ArrowRight') step(next);
		else if (e.key === 'ArrowLeft') step(prev);
		else return;
		e.preventDefault();
	}

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			dialog.showModal();
			// Real full screen is a bonus; the dialog already covers the window without it.
			dialog.requestFullscreen?.().catch(() => {});
		} else if (!open && dialog.open) {
			dialog.close();
		}
	});

	function onclose() {
		open = false;
		if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
	}

	// Leaving browser full screen (Esc, F11) closes the viewer too.
	function onfullscreenchange() {
		if (!document.fullscreenElement && open) open = false;
	}
</script>

<svelte:window bind:innerWidth={width} bind:innerHeight={height} {onkeydown} />
<svelte:document {onfullscreenchange} />

<dialog
	bind:this={dialog}
	{onclose}
	aria-label="{particle.name}, full screen"
	style:--glow={`var(--${particle.category})`}
	style:--c={`var(--${particle.category})`}
>
	{#if open}
		<header>
			<div>
				<span class="dex">{dexNumber(particle)}</span>
				<h2>{particle.name}</h2>
			</div>
			<div class="types">
				{#each particleTypes(particle) as force (force)}
					<TypeBadge {force} />
				{/each}
			</div>
			<button type="button" class="close" aria-label="Close" onclick={() => (open = false)}
				>✕</button
			>
		</header>

		<div class="body" class:wide>
			<div class="stage">
				{#if canStep}
					<button
						type="button"
						class="step"
						aria-label="Previous: {prev?.name}"
						title="Previous: {prev?.name} (←)"
						onclick={() => step(prev)}>‹</button
					>
				{/if}
				<ParticleStage {particle} size={stageSize} {mode} {onselect} />
				{#if canStep}
					<button
						type="button"
						class="step"
						aria-label="Next: {next?.name}"
						title="Next: {next?.name} (→)"
						onclick={() => step(next)}>›</button
					>
				{/if}
			</div>

			<aside class="info">
				<ViewModeToggle {particle} bind:mode />
				<p>
					<span class="symbol"><ParticleSymbol symbol={particle.symbol} /></span>
					{formatMass(particle.massMeV)} · Charge {formatFraction(particle.charge3, 3)} · Spin {formatSpin(
						particle.spin
					)}
				</p>
				<p class="description">{particle.description}</p>
				<section class="stats-panel">
					<h3>Stats</h3>
					<StatBars {particle} />
				</section>
				{#if canStep}
					<p class="hint">← → to browse · {index + 1} of {sequence.length} discovered</p>
				{/if}
			</aside>
		</div>
	{/if}
</dialog>

<style>
	dialog {
		width: 100vw;
		height: 100vh;
		max-width: none;
		max-height: none;
		margin: 0;
		padding: 1rem;
		border: none;
		color: white;
		background: radial-gradient(
			circle at 50% 45%,
			color-mix(in srgb, var(--glow) 20%, #0b0f17),
			#030508 70%
		);
	}

	dialog[open] {
		display: flex;
		flex-direction: column;
	}

	dialog::backdrop {
		background: #030508;
	}

	header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}

	header > div:first-child {
		flex: 1;
	}

	.dex {
		font-size: 0.85rem;
		color: rgb(255 255 255 / 0.6);
	}

	h2 {
		margin: 0;
		font-size: 1.8rem;
		text-transform: capitalize;
	}

	.types {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.close {
		width: 2.5rem;
		height: 2.5rem;
		border: 1px solid rgb(255 255 255 / 0.25);
		border-radius: 50%;
		background: rgb(0 0 0 / 0.4);
		color: white;
		font-size: 1.1rem;
	}

	.close:hover,
	.close:focus-visible {
		border-color: white;
	}

	.body {
		flex: 1;
		display: grid;
		grid-template-rows: auto auto;
		gap: 1rem;
		min-height: 0;
		overflow-y: auto;
	}

	.body.wide {
		grid-template-columns: minmax(0, 1fr) 380px;
		grid-template-rows: none;
		align-items: center;
	}

	.stage {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 0;
	}

	.step {
		flex: none;
		width: 3rem;
		height: 3rem;
		border: 1px solid rgb(255 255 255 / 0.25);
		border-radius: 50%;
		background: rgb(0 0 0 / 0.4);
		color: white;
		font-size: 1.8rem;
		line-height: 1;
	}

	.step:hover,
	.step:focus-visible {
		border-color: white;
		background: rgb(255 255 255 / 0.1);
	}

	.info {
		display: grid;
		gap: 0.6rem;
		align-content: start;
		justify-items: start;
		max-width: 60ch;
		margin: 0 auto;
	}

	.info p {
		margin: 0;
		color: rgb(255 255 255 / 0.8);
	}

	.stats-panel {
		width: 100%;
		padding: 0.8rem 1rem;
		border: 1px solid rgb(255 255 255 / 0.15);
		border-radius: 12px;
		background: rgb(0 0 0 / 0.35);
	}

	h3 {
		margin: 0 0 0.5rem;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: rgb(255 255 255 / 0.6);
	}

	.hint {
		font-size: 0.8rem;
		opacity: 0.6;
	}

	.symbol {
		font-weight: 700;
		color: white;
		margin-right: 0.4rem;
	}

	.description {
		font-size: 0.9rem;
	}
</style>
