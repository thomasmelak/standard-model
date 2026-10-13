<script lang="ts">
	import ParticleChip from './ParticleChip.svelte';
	import { GlassCard, ProgressBar } from '#lib/ui/index.ts';
	import { resolve } from '$app/paths';
	import { game } from '#lib/game/store.svelte.ts';
	import { QUESTS, questDone } from '#lib/game/quests.ts';
	import { reactions } from '#lib/physics/index.ts';

	// The quest checklist. Quests are played in the lab (or a puzzle) and tick
	// themselves off from the collection.

	const done = $derived(QUESTS.filter((q) => questDone(game.collection, q)).length);
	const reactionName = (id: string) => reactions.find((r) => r.id === id)?.name ?? id;
</script>

<GlassCard padding="sm">
	<div class="head">
		<strong>{done} / {QUESTS.length} quests</strong>
		<a href={resolve('/lab')}>Open the Particle Lab</a>
	</div>
	<ProgressBar
		value={done}
		max={QUESTS.length}
		fill="linear-gradient(90deg, var(--lepton), var(--electromagnetic))"
		label="Quests complete"
	/>
</GlassCard>

<ul class="quests">
	{#each QUESTS as q (q.id)}
		{@const complete = questDone(game.collection, q)}
		<GlassCard as="li" padding="sm" glow={complete ? 'var(--lepton)' : undefined}>
			<div class="quest" class:complete>
				<span class="check" aria-hidden="true">{complete ? '✓' : ''}</span>
				<div>
					<strong>{q.title}</strong>
					<span class="sr-only">{complete ? '(complete)' : '(not done yet)'}</span>
					<p class="muted">{q.description}</p>
				</div>
				<span class="goal">
					{#each q.make ?? [] as id (id)}
						<ParticleChip {id} />
					{/each}
					{#if q.react}
						<span class="move" class:known={complete}>
							{complete ? reactionName(q.react) : 'Hidden move'}
						</span>
					{/if}
				</span>
			</div>
		</GlassCard>
	{/each}
</ul>

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}

	.quests {
		display: grid;
		gap: var(--space-2);
		margin: var(--space-4) 0 0;
		padding: 0;
		list-style: none;
	}

	.quest {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--space-1) var(--space-3);
		align-items: start;
	}

	.quest p {
		margin: 0;
		font-size: 0.85rem;
	}

	.check {
		display: grid;
		place-items: center;
		width: 1.6rem;
		height: 1.6rem;
		border: 2px solid var(--glass-line);
		border-radius: 50%;
		font-weight: 700;
	}

	.complete .check {
		border-color: var(--lepton);
		background: color-mix(in srgb, var(--lepton) 25%, transparent);
		color: var(--lepton);
	}

	.goal {
		grid-column: 2;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.move {
		padding: 0.05rem 0.6rem;
		border: 1px dashed var(--border);
		border-radius: var(--radius-pill);
		color: var(--muted);
		font-size: 0.8rem;
	}

	.move.known {
		border-style: solid;
		color: var(--text);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
