<script lang="ts">
	import { GlassCard, ProgressBar } from '#lib/ui/index.ts';
	import { game } from '#lib/game/store.svelte.ts';
	import { RANKS } from '#lib/game/ranks.ts';
	import { xpBreakdown } from '#lib/game/xp.ts';

	// The player's rank: XP, progress to the next rank, where the XP came from,
	// and the whole career ladder.

	const s = $derived(game.standing);
	const lines = $derived(xpBreakdown(game.collection));
</script>

<GlassCard as="section" glow="var(--electromagnetic)" shine>
	<div class="head">
		<span class="icon" aria-hidden="true">{s.rank.icon}</span>
		<div>
			<span class="muted">Your rank</span>
			<h2>{s.rank.name}</h2>
		</div>
		<strong class="xp">{s.xp} XP</strong>
	</div>

	{#if s.next}
		<ProgressBar
			value={s.intoRank}
			max={s.toNext}
			height="0.7rem"
			fill="linear-gradient(90deg, var(--scalar-boson), var(--electromagnetic))"
			label="Progress to {s.next.name}"
		/>
		<p class="muted to-next">{s.toNext - s.intoRank} XP to {s.next.icon} {s.next.name}</p>
	{:else}
		<p class="muted to-next">The top of the field. Congratulations!</p>
	{/if}

	<div class="cols">
		<table>
			<caption class="muted">Where your XP comes from</caption>
			<tbody>
				{#each lines as l (l.label)}
					<tr>
						<th scope="row">{l.label} <span class="muted">({l.rate})</span></th>
						<td>{l.count}</td>
						<td>{l.xp}</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<ol class="ladder" aria-label="Ranks">
			{#each RANKS as r (r.id)}
				{@const reached = s.xp >= r.xp}
				<li class:reached class:current={r.id === s.rank.id}>
					<span aria-hidden="true">{r.icon}</span>
					<div>
						<strong>{r.name}</strong>
						<span class="muted">{r.xp} XP · {r.perk}</span>
					</div>
				</li>
			{/each}
		</ol>
	</div>
</GlassCard>

<style>
	.head {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}

	.head > div {
		flex: 1;
		display: grid;
	}

	.head span.muted {
		font-size: 0.8rem;
	}

	h2 {
		margin: 0;
		font-size: 1.3rem;
	}

	.icon {
		font-size: 2.4rem;
	}

	.xp {
		font-family: var(--font-mono);
		font-size: 1.3rem;
	}

	.to-next {
		margin: var(--space-1) 0 var(--space-3);
		font-size: 0.85rem;
	}

	.cols {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: var(--space-4);
	}

	table {
		border-collapse: collapse;
		font-size: 0.85rem;
	}

	caption {
		text-align: left;
		margin-bottom: var(--space-1);
	}

	th {
		font-weight: 400;
		text-align: left;
	}

	th,
	td {
		padding: 0.25rem 0;
		border-bottom: 1px solid var(--glass-line);
	}

	td {
		padding-left: var(--space-3);
		text-align: right;
		font-family: var(--font-mono);
	}

	.ladder {
		display: grid;
		gap: var(--space-1);
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.85rem;
	}

	.ladder li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		opacity: 0.55;
	}

	.ladder li.reached {
		opacity: 1;
	}

	.ladder li.current {
		background: color-mix(in srgb, var(--electromagnetic) 16%, transparent);
	}

	.ladder div {
		display: grid;
	}
</style>
