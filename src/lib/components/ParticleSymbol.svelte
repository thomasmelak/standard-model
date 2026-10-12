<script lang="ts">
	// Symbols store a subscript after "_" (e.g. "ν_μ"), since Unicode has no subscript μ or τ.
	let { symbol }: { symbol: string } = $props();

	const [base, sub] = $derived(symbol.split('_'));
</script>

{base}{#if sub}<sub>{sub}</sub>{/if}
