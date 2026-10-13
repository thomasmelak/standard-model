<script lang="ts" generics="T extends string">
	// A row of mutually exclusive options in a glass pill, e.g. Orb / Parts.

	interface Props {
		options: { value: T; label: string }[];
		value: T;
		label: string;
	}

	let { options, value = $bindable(), label }: Props = $props();
</script>

<div class="segmented" role="radiogroup" aria-label={label}>
	{#each options as o (o.value)}
		<button
			type="button"
			role="radio"
			aria-checked={value === o.value}
			class:on={value === o.value}
			onclick={() => (value = o.value)}>{o.label}</button
		>
	{/each}
</div>

<style>
	.segmented {
		display: inline-flex;
		padding: 2px;
		border: 1px solid var(--glass-line);
		border-radius: var(--radius-pill);
		background: linear-gradient(135deg, var(--glass-tint), var(--glass-tint-2));
		box-shadow: inset 0 1px 0 var(--glass-edge);
		-webkit-backdrop-filter: blur(8px);
		backdrop-filter: blur(8px);
	}

	button {
		padding: 0.15rem 0.65rem;
		border: none;
		border-radius: var(--radius-pill);
		background: none;
		color: var(--muted);
		font-size: 0.78rem;
	}

	button.on {
		background: color-mix(in srgb, var(--text) 16%, transparent);
		color: var(--text);
	}

	button:focus-visible {
		outline: 2px solid var(--accent);
	}
</style>
