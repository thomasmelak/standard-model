<script lang="ts">
	import Orb from './Orb.svelte';
	import { Button, GlassCard } from '#lib/ui/index.ts';
	import { resolve } from '$app/paths';
	import { game } from '#lib/game/store.svelte.ts';
	import { getParticle } from '#lib/physics/index.ts';

	// Celebrates one unlock at a time: a new particle, a completed quest, a new badge or a
	// promotion. Each stays
	// a few seconds, or until clicked.

	const current = $derived(game.unlocks[0]);

	$effect(() => {
		if (!current) return;
		const key = current.key;
		const timer = setTimeout(() => game.dismiss(key), 4500);
		return () => clearTimeout(timer);
	});
</script>

<div class="region" aria-live="polite">
	{#if current}
		{#key current.key}
			<div class="pop">
				<GlassCard
					glow={current.particle
						? `var(--${getParticle(current.particle).category})`
						: 'var(--electromagnetic)'}
					shine
					padding="none"
				>
					<div class="toast">
						{#if current.particle}
							{@const p = getParticle(current.particle)}
							<span class="burst" style:--c={`var(--${p.category})`}
								><Orb particle={p} size={56} /></span
							>
							<div>
								<strong>New discovery!</strong>
								<span class="name">{p.name}</span>
								<a href={resolve('/dex')}>Added to your dex</a>
							</div>
						{:else if current.quest}
							<span class="medal" aria-hidden="true">🎯</span>
							<div>
								<strong>Quest complete!</strong>
								<span>{current.quest.title}</span>
								<a href={resolve('/challenges')}>See your quests</a>
							</div>
						{:else if current.rank}
							<span class="medal" aria-hidden="true">{current.rank.icon}</span>
							<div>
								<strong>Promoted: {current.rank.name}!</strong>
								<span>{current.rank.perk}</span>
							</div>
						{:else if current.badge}
							<span class="medal" aria-hidden="true">🏅</span>
							<div>
								<strong>Badge earned: {current.badge.name}</strong>
								<span>{current.badge.description}</span>
							</div>
						{/if}
						<span class="close">
							<Button
								icon
								size="sm"
								variant="ghost"
								aria-label="Dismiss"
								onclick={() => game.dismiss(current.key)}>✕</Button
							>
						</span>
					</div>
				</GlassCard>
			</div>
		{/key}
	{/if}
</div>

<style>
	.region {
		position: fixed;
		right: 1rem;
		/* Above the bottom tab bar on portrait phones. */
		bottom: calc(1rem + var(--tabbar-h, 0px));
		z-index: 900;
	}

	.pop {
		animation: pop 0.45s cubic-bezier(0.2, 1.4, 0.4, 1);
	}

	.toast {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.9rem;
		min-width: 260px;
		padding: 0.75rem 2.4rem 0.75rem 0.9rem;
	}

	.toast > div {
		display: grid;
	}

	.name {
		text-transform: capitalize;
	}

	a {
		font-size: 0.8rem;
	}

	/* The new orb arrives in a flash of its own colour. */
	.burst {
		display: grid;
		place-items: center;
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			color-mix(in srgb, var(--c) 45%, transparent),
			transparent 70%
		);
		animation: flash 1.2s ease-out;
	}

	.medal {
		font-size: 2.4rem;
		animation: flash 1.2s ease-out;
	}

	.close {
		position: absolute;
		top: 0.3rem;
		right: 0.3rem;
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(16px) scale(0.85) rotateX(40deg);
		}
	}

	@keyframes flash {
		0% {
			transform: scale(0.3);
			filter: brightness(3);
		}
		60% {
			transform: scale(1.15);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pop,
		.burst,
		.medal {
			animation: none;
		}
	}
</style>
