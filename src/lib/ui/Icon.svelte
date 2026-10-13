<script lang="ts" module>
	// Line icons on a 24px grid, drawn with currentColor so they follow the text.
	const paths = {
		// Particles: an atom
		atom: 'M12 12m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0 M12 3c4.4 0 8 4 8 9s-3.6 9-8 9-8-4-8-9 3.6-9 8-9z M4.3 7.5c2.2-3.8 7.6-3.7 12 .9s5.4 9.9 3.4 12.1-7.6.6-12-4-5.6-7.2-3.4-9z',
		// Lab: a flask
		flask: 'M9 3h6 M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3 M7.5 15h9',
		// Interactions: two particles exchanging a wavy carrier
		interact:
			'M5 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M19 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M7 12c1.5-3 3-3 4.5 0s3 3 4.5 0',
		// Dex: a deck of cards
		cards:
			'M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M9 9h6 M9 13h6 M3 7v11 M21 7v11',
		// Stats: bars
		stats: 'M5 20V11 M10 20V5 M15 20v-7 M20 20V8 M3 20h18',
		// Evolution: one splitting into a composite
		evolve:
			'M6 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M6 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M18 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M8 6l8 5 M8 18l8-5',
		// Challenges: a target
		target:
			'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0 M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
		// Moves: a lightning bolt
		bolt: 'M13 2 4 14h7l-1 8 9-12h-7z'
	} as const;

	export type IconName = keyof typeof paths;
</script>

<script lang="ts">
	let { name, size = 22, label }: { name: IconName; size?: number; label?: string } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.7"
	stroke-linecap="round"
	stroke-linejoin="round"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
>
	<path d={paths[name]} />
</svg>
