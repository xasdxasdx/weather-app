<script lang="ts">
	const { size = 14, stroke = 3 } = $props<{
		size?: number;
		stroke?: number;
	}>();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	aria-hidden="true"
>
	<path d="M18 6L6 18M6 6l12 12" />
</svg>