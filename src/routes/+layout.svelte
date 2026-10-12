<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const links = [
		{ href: resolve('/'), label: 'Particles' },
		{ href: resolve('/lab'), label: 'Particle Lab' },
		{ href: resolve('/interactions'), label: 'Interactions' }
	];
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
			</a>
		{/each}
		<ThemeToggle />
	</nav>
</header>

<main>
	{@render children()}
</main>

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
