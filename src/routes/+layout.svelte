<script lang="ts">
	import '@fontsource/orbitron/500.css';
	import '@fontsource/orbitron/700.css';
	import '@fontsource/exo-2/400.css';
	import '@fontsource/exo-2/600.css';
	import '@fontsource/exo-2/700.css';
	import '@fontsource/share-tech-mono/400.css';
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import UnlockToast from '#lib/components/UnlockToast.svelte';
	import { game } from '#lib/game/store.svelte.ts';
	import { Icon, type IconName } from '#lib/ui/index.ts';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const links = [
		{ href: resolve('/'), label: 'Particles', short: 'Particles', icon: 'atom' as IconName },
		{ href: resolve('/lab'), label: 'Particle Lab', short: 'Lab', icon: 'flask' as IconName },
		{
			href: resolve('/interactions'),
			label: 'Interactions',
			short: 'Forces',
			icon: 'interact' as IconName
		},
		{ href: resolve('/dex'), label: 'Dex', short: 'Dex', icon: 'cards' as IconName }
	];

	onMount(() => game.load());
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>The Standard Model</title>
</svelte:head>

<header>
	<a class="brand" href={resolve('/')}>The Standard Model</a>
	<nav aria-label="Main">
		{#each links as link (link.href)}
			<a href={link.href} aria-current={page.url.pathname === link.href ? 'page' : undefined}>
				{link.label}
				{#if link.label === 'Dex'}
					<span class="count">{game.progress.found}/{game.progress.total}</span>
				{/if}
			</a>
		{/each}
	</nav>
	<ThemeToggle />
</header>

<main>
	{@render children()}
</main>

<footer>
	<a href={resolve('/design')}>Design system</a>
</footer>

<!-- Portrait phones: the same links as icon tabs within thumb's reach. -->
<nav class="tabbar" aria-label="Main">
	{#each links as link (link.href)}
		<a href={link.href} aria-current={page.url.pathname === link.href ? 'page' : undefined}>
			<span class="tab-icon">
				<Icon name={link.icon} />
				{#if link.icon === 'cards'}
					<span class="dot">{game.progress.found}</span>
				{/if}
			</span>
			<span class="tab-label">{link.short}</span>
		</a>
	{/each}
</nav>

<UnlockToast />

<style>
	header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		/* A frosted glass bar that stays at the top as the page scrolls under it. */
		position: sticky;
		top: 0;
		z-index: 50;
		border-bottom: 1px solid var(--glass-line);
		background: linear-gradient(180deg, var(--glass-tint), var(--glass-tint-2));
		-webkit-backdrop-filter: blur(var(--blur-glass)) saturate(140%);
		backdrop-filter: blur(var(--blur-glass)) saturate(140%);
		box-shadow: inset 0 -1px 0 var(--glass-edge);
	}

	.brand {
		font-family: var(--font-display);
		font-weight: 700;
		letter-spacing: 0.02em;
		color: var(--text);
		text-decoration: none;
	}

	header nav {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-left: auto;
	}

	header nav a {
		color: var(--muted);
		text-decoration: none;
	}

	/* Bottom tab bar: hidden until the screen is a portrait phone or tablet. */
	.tabbar {
		display: none;
	}

	@media (orientation: portrait) and (max-width: 900px) {
		header nav {
			display: none;
		}

		:global(:root) {
			--tabbar-h: calc(4rem + env(safe-area-inset-bottom));
		}

		:global(body) {
			padding-bottom: var(--tabbar-h);
		}

		.tabbar {
			position: fixed;
			right: 0;
			bottom: 0;
			left: 0;
			z-index: 60;
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			height: var(--tabbar-h);
			padding-bottom: calc(0.35rem + env(safe-area-inset-bottom));
			border-top: 1px solid var(--glass-line);
			/* Mostly solid: busy content scrolls right under it, and the labels must stay legible. */
			background:
				linear-gradient(0deg, var(--glass-tint), var(--glass-tint-2)),
				color-mix(in srgb, var(--bg) 82%, transparent);
			-webkit-backdrop-filter: blur(var(--blur-glass)) saturate(140%);
			backdrop-filter: blur(var(--blur-glass)) saturate(140%);
			box-shadow: inset 0 1px 0 var(--glass-edge);
		}

		.tabbar a {
			display: grid;
			place-items: center;
			align-content: center;
			gap: 0.15rem;
			color: var(--muted);
			text-decoration: none;
			font-size: 0.7rem;
		}

		.tabbar a[aria-current='page'] {
			color: var(--accent);
		}

		/* The current tab's icon sits in a small lit pill. */
		.tabbar a[aria-current='page'] .tab-icon {
			background: color-mix(in srgb, var(--accent) 16%, transparent);
			box-shadow: 0 0 14px color-mix(in srgb, var(--accent) 30%, transparent);
		}
	}

	.tab-icon {
		position: relative;
		display: grid;
		place-items: center;
		width: 3rem;
		height: 1.8rem;
		border-radius: var(--radius-pill);
		transition: background 0.2s;
	}

	.dot {
		position: absolute;
		top: -0.3rem;
		right: 0.1rem;
		min-width: 1.1rem;
		padding: 0 0.25rem;
		border-radius: var(--radius-pill);
		background: var(--accent-strong);
		color: var(--on-accent);
		font-family: var(--font-mono);
		font-size: 0.65rem;
		line-height: 1.1rem;
		text-align: center;
	}

	footer {
		padding: 1rem;
		text-align: center;
		font-size: 0.8rem;
	}

	footer a {
		color: var(--muted);
	}

	.count {
		margin-left: 0.25rem;
		padding: 0 0.4rem;
		border-radius: var(--radius-pill);
		background: var(--surface-2);
		font-family: var(--font-mono);
		font-size: 0.8rem;
	}

	header nav a[aria-current='page'] {
		color: var(--text);
		border-bottom: 2px solid var(--accent);
	}

	main {
		max-width: 1100px;
		margin: 0 auto;
		padding: 1.5rem 1rem 3rem;
	}
</style>
