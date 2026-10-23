<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
    import { setContext } from 'svelte';
    import { Toolbar } from '#lib/state.svelte.ts';

	let { children }: LayoutProps = $props();

    setContext('toolbar', new Toolbar());
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
