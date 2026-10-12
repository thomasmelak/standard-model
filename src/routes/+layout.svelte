<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import UnlockToast from '#lib/components/UnlockToast.svelte';
	import { game } from '#lib/game/store.svelte.ts';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const links = [
		{ href: resolve('/'), label: 'Particles' },
		{ href: resolve('/lab'), label: 'Particle Lab' },
		{ href: resolve('/interactions'), label: 'Interactions' },
		{ href: resolve('/dex'), label: 'Dex' }
	];

	onMount(() => game.load());
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>The Standard Model</title>
</svelte:head>

<header>
	<a class="brand" href={resolve('/')}>The Standard Model</a>
	<nav>
		{#each links as link (link.href)}
			<a href={link.href} aria-current={page.url.pathname === link.href ? 'page' : undefined}>
				{link.label}
				{#if link.label === 'Dex'}
					<span class="count">{game.progress.found}/{game.progress.total}</span>
				{/if}
			</a>
		{/each}
		<ThemeToggle />
	</nav>
</header>

<main>
	{@render children()}
</main>

<UnlockToast />

<style>
	header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--border);
		background: var(--surface);
	}

	.brand {
		font-weight: 700;
		color: var(--text);
		text-decoration: none;
	}

	nav {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	nav a {
		color: var(--muted);
		text-decoration: none;
	}

	.count {
		margin-left: 0.25rem;
		padding: 0 0.4rem;
		border-radius: 999px;
		background: var(--surface-2);
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
	}

	nav a[aria-current='page'] {
		color: var(--text);
		border-bottom: 2px solid var(--accent);
	}

	main {
		max-width: 1100px;
		margin: 0 auto;
		padding: 1.5rem 1rem 3rem;
	}
</style>
