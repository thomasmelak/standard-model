<script lang="ts">
	import { Badge } from '#lib/ui/index.ts';
	import type { Force } from '#lib/physics/index.ts';

	let { force }: { force: Force } = $props();

	const names: Record<Force, string> = {
		strong: 'Strong',
		electromagnetic: 'Electric',
		weak: 'Weak',
		higgs: 'Higgs'
	};
</script>

<Badge color={`var(--${force})`}>{names[force]}</Badge>
