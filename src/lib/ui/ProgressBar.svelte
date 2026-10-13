<script lang="ts">
	// A rounded bar filled to `value` out of `max`, in a colour (or a gradient).

	interface Props {
		value: number;
		max?: number;
		/** Fill: any CSS colour or gradient. Defaults to the surrounding --c. */
		fill?: string;
		height?: string;
		label?: string;
	}

	let { value, max = 100, fill, height = '0.55rem', label }: Props = $props();

	const percent = $derived(Math.max(0, Math.min(100, (value / max) * 100)));
</script>

<span
	class="bar"
	style:--h={height}
	role="progressbar"
	aria-valuemin={0}
	aria-valuemax={max}
	aria-valuenow={value}
	aria-label={label}
>
	<span
		style:width={`${percent}%`}
		style:background={fill ??
			'linear-gradient(90deg, color-mix(in srgb, var(--c) 60%, white), var(--c))'}
	></span>
</span>

<style>
	.bar {
		display: block;
		height: var(--h);
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, currentColor 12%, transparent);
		overflow: hidden;
	}

	.bar span {
		display: block;
		height: 100%;
		border-radius: inherit;
		transition: width 0.5s var(--ease-out);
	}
</style>
