<script lang="ts">
	import ParticleStage from './ParticleStage.svelte';
	import ParticleSymbol from './ParticleSymbol.svelte';
	import StatBars from './StatBars.svelte';
	import TypeBadge from './TypeBadge.svelte';
	import { game } from '#lib/game/store.svelte.ts';
	import ViewModeToggle, { type ViewMode } from './ViewModeToggle.svelte';
	import { Button, GlassCard, SectionLabel } from '#lib/ui/index.ts';
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

	// Landscape: orb and stats side by side, stats 30vw wide. Portrait: stacked, stats 90vw.
	const wide = $derived(width > height);
	// The stats column never drops below 240px, where its bars stop being readable.
	const column = $derived(Math.max(width * 0.3, 240));
	// Leave room for the header, arrows and (in landscape) the stats column.
	const stageSize = $derived(
		Math.max(200, Math.min(width - (wide ? column + 200 : 168), height - (wide ? 160 : 320), 720))
	);

	// Swipe left for the next particle, right for the previous one, anywhere on the
	// orb's stage or the stats card. Drags on the orb itself rotate it instead.
	let swipe: { x: number; y: number; id: number } | null = null;

	function onpointerdown(e: PointerEvent) {
		if (e.pointerType === 'mouse') return;
		swipe = { x: e.clientX, y: e.clientY, id: e.pointerId };
	}

	function onpointerup(e: PointerEvent) {
		if (!swipe || e.pointerId !== swipe.id) return;
		const dx = e.clientX - swipe.x;
		const dy = e.clientY - swipe.y;
		swipe = null;
		// Mostly sideways and far enough to be deliberate.
		if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
		step(dx < 0 ? next : prev);
	}

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
	class="on-dark"
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
			<Button icon aria-label="Close" onclick={() => (open = false)}>✕</Button>
		</header>

		<div
			class="body swipe-area"
			class:wide
			style:--column={`${column}px`}
			role="group"
			aria-label={canStep ? `${particle.name}. Swipe to browse.` : particle.name}
			{onpointerdown}
			{onpointerup}
			onpointercancel={() => (swipe = null)}
		>
			<div class="stage">
				{#if canStep}
					<Button
						icon
						size="lg"
						aria-label="Previous: {prev?.name}"
						title="Previous: {prev?.name} (←)"
						onclick={() => step(prev)}>‹</Button
					>
				{/if}
				<ParticleStage {particle} size={stageSize} {mode} {onselect} rotatable />
				{#if canStep}
					<Button
						icon
						size="lg"
						aria-label="Next: {next?.name}"
						title="Next: {next?.name} (→)"
						onclick={() => step(next)}>›</Button
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
				<GlassCard as="section" glow="var(--c)" shine class="stats-card">
					<div class="types" aria-label="Interactions">
						{#each particleTypes(particle) as force (force)}
							<TypeBadge {force} />
						{/each}
					</div>
					<SectionLabel>Stats</SectionLabel>
					<StatBars {particle} />
				</GlassCard>
				{#if canStep}
					<p class="hint">
						Drag the orb to rotate · Swipe or ← → to browse · {index + 1} of {sequence.length} discovered
					</p>
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
		color: var(--muted);
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
		margin-bottom: 0.75rem;
	}

	/* The orb and the stats card both take swipes; vertical scrolling stays native. */
	.body {
		touch-action: pan-y;
		flex: 1;
		display: grid;
		grid-template-rows: auto auto;
		gap: 1rem;
		min-height: 0;
		overflow-y: auto;
	}

	/* In landscape the orb stays centred on screen; a tall stats column scrolls on its own. */
	.body.wide {
		grid-template-columns: minmax(0, 1fr) var(--column);
		grid-template-rows: minmax(0, 1fr);
		align-items: center;
		overflow: hidden;
	}

	.stage {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 0;
	}

	.info {
		display: grid;
		gap: 0.6rem;
		align-content: start;
		justify-items: start;
		width: 90vw;
		margin: 0 auto;
	}

	.wide .info {
		width: 100%;
		max-height: 100%;
		overflow-y: auto;
	}

	.info p {
		margin: 0;
		color: rgb(255 255 255 / 0.8);
	}

	.info :global(.stats-card) {
		width: 100%;
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
