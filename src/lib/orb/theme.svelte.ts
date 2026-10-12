// Orb colours come from CSS theme variables, but canvases can't follow CSS on
// their own. This counter changes whenever the effective theme may have
// changed (toggle or OS setting), so orb components can redraw.

let version = $state(0);
let watching = false;

function watch() {
	if (watching || typeof window === 'undefined') return;
	watching = true;
	new MutationObserver(() => version++).observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['data-theme']
	});
	matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => version++);
}

/** Read inside an effect to re-run it when the theme changes. */
export function themeVersion(): number {
	watch();
	return version;
}
