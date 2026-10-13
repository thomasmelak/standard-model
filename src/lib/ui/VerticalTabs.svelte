<script lang="ts" generics="T extends string">
	import type { Snippet } from 'svelte';
	import Icon, { type IconName } from './Icon.svelte';

	// An icon rail down the left of a panel; the panel shows the selected tab.
	// ↑ and ↓ move between tabs (← and → are left free for the page).

	interface Props {
		tabs: { id: T; label: string; icon: IconName }[];
		value: T;
		label: string;
		/** Renders the selected tab's content. */
		children: Snippet<[T]>;
	}

	let { tabs, value = $bindable(), label, children }: Props = $props();

	const uid = $props.id();
	let rail = $state<HTMLDivElement>();

	function onkeydown(e: KeyboardEvent) {
		const i = tabs.findIndex((t) => t.id === value);
		let next: number;
		if (e.key === 'ArrowDown') next = (i + 1) % tabs.length;
		else if (e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
		else if (e.key === 'Home') next = 0;
		else if (e.key === 'End') next = tabs.length - 1;
		else return;
		e.preventDefault();
		e.stopPropagation();
		value = tabs[next].id;
		rail?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
	}
</script>

<div class="vtabs">
	<div
		bind:this={rail}
		class="rail"
		role="tablist"
		aria-label={label}
		aria-orientation="vertical"
		tabindex="-1"
		{onkeydown}
	>
		{#each tabs as tab (tab.id)}
			<button
				type="button"
				role="tab"
				id="{uid}-tab-{tab.id}"
				aria-selected={value === tab.id}
				aria-controls="{uid}-panel"
				tabindex={value === tab.id ? 0 : -1}
				title={tab.label}
				class:on={value === tab.id}
				onclick={() => (value = tab.id)}
			>
				<Icon name={tab.icon} size={20} />
				<span class="sr">{tab.label}</span>
			</button>
		{/each}
	</div>
	<div class="panel" role="tabpanel" id="{uid}-panel" aria-labelledby="{uid}-tab-{value}">
		{@render children(value)}
	</div>
</div>

<style>
	.vtabs {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: var(--space-3);
	}

	.rail {
		display: grid;
		align-content: start;
		gap: var(--space-1);
		padding-right: var(--space-2);
		border-right: 1px solid var(--glass-line);
	}

	button {
		display: grid;
		place-items: center;
		width: 2.4rem;
		height: 2.4rem;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		background: none;
		color: var(--muted);
		transition:
			color 0.15s,
			background 0.15s;
	}

	button:hover {
		color: var(--text);
	}

	/* The selected tab: a lit pane of glass in the card's colour. */
	button.on {
		border-color: color-mix(in srgb, var(--c, var(--accent)) 50%, transparent);
		background: color-mix(in srgb, var(--c, var(--accent)) 18%, transparent);
		box-shadow:
			inset 0 1px 0 var(--glass-edge),
			0 0 14px color-mix(in srgb, var(--c, var(--accent)) 35%, transparent);
		color: var(--text);
	}

	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}

	.panel {
		min-width: 0;
	}

	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
