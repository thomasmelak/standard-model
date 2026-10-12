<script lang="ts">
	import { onMount } from 'svelte';

	type Theme = 'light' | 'dark';

	const STORAGE_KEY = 'theme';

	// Updated on mount; the server render cannot know the visitor's preference.
	let theme = $state<Theme>('light');

	onMount(() => {
		const chosen = document.documentElement.dataset.theme;
		if (chosen === 'light' || chosen === 'dark') theme = chosen;
		else theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	});

	function toggle() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem(STORAGE_KEY, theme);
		} catch {
			// Storage can be unavailable (private mode); the choice then lasts for this page view.
		}
	}
</script>

<button
	type="button"
	class="toggle"
	onclick={toggle}
	aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
	title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
>
	{theme === 'dark' ? '☀' : '☾'}
</button>

<style>
	.toggle {
		width: 2rem;
		height: 2rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface-2);
		line-height: 1;
	}

	.toggle:hover {
		border-color: var(--accent);
	}
</style>
