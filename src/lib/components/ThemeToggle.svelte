<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '#lib/ui/index.ts';

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

<Button
	icon
	onclick={toggle}
	aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
	title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
>
	{theme === 'dark' ? '☀' : '☾'}
</Button>
