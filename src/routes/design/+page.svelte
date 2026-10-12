<script lang="ts">
	import Orb from '#lib/components/Orb.svelte';
	import StatBars from '#lib/components/StatBars.svelte';
	import TypeBadge from '#lib/components/TypeBadge.svelte';
	import {
		Badge,
		Button,
		Chip,
		GlassCard,
		ProgressBar,
		SectionLabel,
		SegmentedControl
	} from '#lib/ui/index.ts';
	import { getParticle, type Force } from '#lib/physics/index.ts';

	// A living reference for the design system: every token and component as the
	// app actually renders them. Documented in docs/DESIGN_SYSTEM.md.

	const categories = [
		'quark',
		'lepton',
		'gauge-boson',
		'scalar-boson',
		'hadron',
		'nucleus',
		'atom'
	];
	const forces: Force[] = ['strong', 'electromagnetic', 'weak', 'higgs'];
	let segment = $state<'orb' | 'parts' | 'fundamental'>('orb');
</script>

<svelte:head>
	<title>Design system · The Standard Model</title>
</svelte:head>

<h1>Design system</h1>
<p class="muted">
	Glass surfaces, a small set of components and shared tokens. Switch the theme in the header to see
	both palettes. Source: <code>src/lib/ui</code> and <code>src/app.css</code>.
</p>

<section>
	<h2>Colour</h2>
	<div class="swatches">
		{#each [...categories, ...forces] as name (name)}
			<div class="swatch">
				<span style:background={`var(--${name})`}></span>
				<code>--{name}</code>
			</div>
		{/each}
	</div>
</section>

<section>
	<h2>Glass cards</h2>
	<div class="cards">
		<GlassCard>
			<SectionLabel>Default</SectionLabel>
			<p>A frosted pane: the standard surface for every panel.</p>
		</GlassCard>
		<GlassCard glow="var(--quark)">
			<SectionLabel>glow</SectionLabel>
			<p>Tinted and lit with a colour, e.g. a particle's category.</p>
		</GlassCard>
		<GlassCard glow="var(--lepton)" shine>
			<SectionLabel>glow + shine</SectionLabel>
			<p>Featured cards: a glint circles the rim, a sheen sweeps across.</p>
		</GlassCard>
		<GlassCard ghost>
			<SectionLabel>ghost</SectionLabel>
			<p>Dashed and dimmed: locked or not available yet.</p>
		</GlassCard>
	</div>

	<div class="on-dark dark-stage">
		<GlassCard glow="var(--hadron)" shine>
			<SectionLabel>On a dark stage (.on-dark)</SectionLabel>
			<StatBars particle={getParticle('p')} />
		</GlassCard>
	</div>
</section>

<section>
	<h2>Buttons</h2>
	<div class="row">
		<Button variant="primary">Primary</Button>
		<Button>Secondary</Button>
		<Button variant="ghost">Ghost</Button>
		<Button disabled>Disabled</Button>
		<Button size="sm">Small</Button>
		<Button size="lg">Large</Button>
		<Button icon aria-label="Close">✕</Button>
		<Button icon size="lg" aria-label="Next">›</Button>
		<Button icon size="sm" variant="ghost" aria-label="Remove">×</Button>
	</div>
</section>

<section>
	<h2>Badges, chips, controls</h2>
	<div class="row">
		{#each forces as force (force)}
			<TypeBadge {force} />
		{/each}
		<Badge color="var(--ok)">Custom</Badge>
	</div>
	<div class="row">
		<Chip onclick={() => {}}><Orb particle={getParticle('e-')} size={16} /><span>e⁻</span></Chip>
		<Chip><Orb particle={getParticle('u')} size={16} /><span>u</span></Chip>
		<Chip locked>?</Chip>
	</div>
	<div class="row">
		<SegmentedControl
			options={[
				{ value: 'orb', label: 'Orb' },
				{ value: 'parts', label: 'Parts' },
				{ value: 'fundamental', label: 'Quarks & leptons' }
			]}
			bind:value={segment}
			label="Example"
		/>
	</div>
	<div class="bars">
		<ProgressBar value={72} fill="var(--accent)" label="Example" />
		<ProgressBar
			value={40}
			height="0.7rem"
			fill="linear-gradient(90deg, var(--quark), var(--lepton), var(--electromagnetic))"
			label="Gradient example"
		/>
	</div>
</section>

<style>
	section {
		margin-bottom: 2rem;
	}

	.swatches {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: var(--space-2);
	}

	.swatch {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: 0.8rem;
	}

	.swatch span {
		width: 1.6rem;
		height: 1.6rem;
		border-radius: var(--radius-sm);
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: var(--space-4);
	}

	.cards p {
		margin: 0;
	}

	.dark-stage {
		margin-top: var(--space-4);
		padding: var(--space-5);
		border-radius: var(--radius-lg);
		background: radial-gradient(
			circle at 30% 40%,
			color-mix(in srgb, var(--hadron) 25%, #0b0f17),
			#030508 70%
		);
		--c: var(--hadron);
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-3);
	}

	.bars {
		display: grid;
		gap: var(--space-3);
		max-width: 400px;
	}
</style>
