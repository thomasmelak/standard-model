<script lang="ts">
	import ParticleStage from './ParticleStage.svelte';
	import ParticleSymbol from './ParticleSymbol.svelte';
	import TypeBadge from './TypeBadge.svelte';
	import ViewModeToggle, { type ViewMode } from './ViewModeToggle.svelte';
	import {
		dexNumber,
		formatFraction,
		formatMass,
		formatSpin,
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

	// Leave room for the header and caption around the orb.
	const stageSize = $derived(Math.max(240, Math.min(width - 32, height - 220, 760)));

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

<svelte:window bind:innerWidth={width} bind:innerHeight={height} />
<svelte:document {onfullscreenchange} />

<dialog
	bind:this={dialog}
	{onclose}
	aria-label="{particle.name}, full screen"
	style:--glow={`var(--${particle.category})`}
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

		<div class="stage">
			<ParticleStage {particle} size={stageSize} {mode} {onselect} />
		</div>

		<footer>
			<ViewModeToggle {particle} bind:mode />
			<p>
				<span class="symbol"><ParticleSymbol symbol={particle.symbol} /></span>
				{formatMass(particle.massMeV)} · Charge {formatFraction(particle.charge3, 3)} · Spin {formatSpin(
					particle.spin
				)}
			</p>
			<p class="description">{particle.description}</p>
		</footer>
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

	.stage {
		flex: 1;
		display: grid;
		place-items: center;
		min-height: 0;
	}

	footer {
		display: grid;
		justify-items: center;
		gap: 0.4rem;
		text-align: center;
	}

	footer p {
		margin: 0;
		color: rgb(255 255 255 / 0.8);
	}

	.symbol {
		font-weight: 700;
		color: white;
		margin-right: 0.4rem;
	}

	.description {
		max-width: 60ch;
		font-size: 0.9rem;
	}
</style>
