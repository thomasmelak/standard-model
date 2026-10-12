import type { Action } from 'svelte/action';

// Pointer-based drag and drop (works with mouse, pen and touch, unlike the
// HTML5 drag API). Drop zones are elements with a `data-drop` attribute; the
// dragged element reports which zone it was released over.

export interface DraggableOptions {
	/** Called on release with the `data-drop` value under the pointer, or null outside any zone. */
	ondrop: (zone: string | null) => void;
}

/** Pixels the pointer must travel before a press turns into a drag (below it, it's a click). */
const THRESHOLD = 6;

function zoneAt(x: number, y: number): HTMLElement | null {
	return document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop]') ?? null;
}

/** A floating copy of the element that follows the pointer, canvases included. */
function makeGhost(node: HTMLElement): HTMLElement {
	const rect = node.getBoundingClientRect();
	const ghost = node.cloneNode(true) as HTMLElement;
	const from = node.querySelectorAll('canvas');
	ghost.querySelectorAll('canvas').forEach((c, i) => {
		c.width = from[i].width;
		c.height = from[i].height;
		c.getContext('2d')?.drawImage(from[i], 0, 0);
	});
	Object.assign(ghost.style, {
		position: 'fixed',
		left: `${rect.left}px`,
		top: `${rect.top}px`,
		width: `${rect.width}px`,
		height: `${rect.height}px`,
		margin: '0',
		pointerEvents: 'none',
		zIndex: '1000',
		opacity: '0.9',
		transform: 'scale(1.08)',
		filter: 'drop-shadow(0 8px 16px rgb(0 0 0 / 0.35))'
	});
	document.body.append(ghost);
	return ghost;
}

export const draggable: Action<HTMLElement, DraggableOptions> = (node, initial) => {
	let options = initial;
	let start: { x: number; y: number; dx: number; dy: number } | null = null;
	let ghost: HTMLElement | null = null;
	let over: HTMLElement | null = null;

	function setOver(zone: HTMLElement | null) {
		if (zone === over) return;
		over?.classList.remove('drop-over');
		zone?.classList.add('drop-over');
		over = zone;
	}

	function onDown(e: PointerEvent) {
		if (e.button !== 0) return;
		const rect = node.getBoundingClientRect();
		start = { x: e.clientX, y: e.clientY, dx: e.clientX - rect.left, dy: e.clientY - rect.top };
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp, { once: true });
		window.addEventListener('pointercancel', cleanup, { once: true });
	}

	function onMove(e: PointerEvent) {
		if (!start) return;
		if (!ghost) {
			if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < THRESHOLD) return;
			ghost = makeGhost(node);
			node.classList.add('dragging');
			document.body.classList.add('is-dragging');
		}
		e.preventDefault();
		ghost.style.left = `${e.clientX - start.dx}px`;
		ghost.style.top = `${e.clientY - start.dy}px`;
		setOver(zoneAt(e.clientX, e.clientY));
	}

	function onUp(e: PointerEvent) {
		if (ghost) {
			const zone = zoneAt(e.clientX, e.clientY);
			// The press ended a drag, not a click: swallow the click that follows it
			// (dispatched in the same task as pointerup), then remove the guard.
			node.addEventListener('click', swallow, { capture: true });
			setTimeout(() => node.removeEventListener('click', swallow, { capture: true }), 0);
			options.ondrop(zone?.dataset.drop ?? null);
		}
		cleanup();
	}

	function swallow(e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
	}

	function cleanup() {
		window.removeEventListener('pointermove', onMove);
		window.removeEventListener('pointercancel', cleanup);
		ghost?.remove();
		ghost = null;
		start = null;
		setOver(null);
		node.classList.remove('dragging');
		document.body.classList.remove('is-dragging');
	}

	// Touch: stop the page from scrolling instead of dragging.
	node.style.touchAction = 'none';
	node.addEventListener('pointerdown', onDown);

	return {
		update(next) {
			options = next;
		},
		destroy() {
			node.removeEventListener('pointerdown', onDown);
			cleanup();
		}
	};
};
