<script lang="ts">
	import { resolve } from '$app/paths';
	import { game } from '#lib/game/store.svelte.ts';
	import { RANKS } from '#lib/game/ranks.ts';

	// The player's rank in the header, linking to the full rank card on the dex.

	const s = $derived(game.standing);
	const level = $derived(RANKS.indexOf(s.rank) + 1);
</script>

<a
	class="rank-chip"
	href="{resolve('/dex')}#rank"
	title="{s.rank.name} · {s.xp} XP"
	aria-label="Rank: {s.rank.name}, {s.xp} XP"
>
	<span aria-hidden="true">{s.rank.icon}</span>
	<span class="level">Lv {level}</span>
	<span class="name">{s.rank.name}</span>
</a>

<style>
	.rank-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.15rem 0.6rem;
		border: 1px solid var(--glass-line);
		border-radius: var(--radius-pill);
		background: linear-gradient(135deg, var(--glass-tint), var(--glass-tint-2));
		box-shadow: inset 0 1px 0 var(--glass-edge);
		color: var(--text);
		font-size: 0.8rem;
		text-decoration: none;
		white-space: nowrap;
	}

	.rank-chip:hover,
	.rank-chip:focus-visible {
		border-color: var(--accent);
	}

	.level {
		font-family: var(--font-mono);
	}

	/* On narrow screens the level alone says enough. */
	@media (max-width: 600px) {
		.name {
			display: none;
		}
	}
</style>
