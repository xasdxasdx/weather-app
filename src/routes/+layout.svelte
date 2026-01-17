<script lang="ts">
    import Sidebar from '$lib/components/Sidebar.svelte';
    import MobileMenu from '$lib/components/MobileMenu.svelte';
    import { weatherState, updateWeather, getWeatherInfo } from '$lib/weather.svelte';
    import { loadFavorites } from '$lib/favorites.svelte';
    import '$lib/styles/layout.css';
    import '$lib/styles/ui.css';


    let { children } = $props();
    
    let theme = $derived(getWeatherInfo(weatherState.weather?.code));

    $effect(() => {
        loadFavorites();
        updateWeather();
        const interval = setInterval(updateWeather, 1800000);
        return () => clearInterval(interval);
    });
</script>

<div class="theme-wrapper" style="background-image: url({theme.bg})">
    <aside class="sidebar glass-panel">
        <h1>Weather</h1>
        <Sidebar />
    </aside>

    {@render children()} 
</div>

<button class="burger-btn" onclick={() => weatherState.menuOpen = !weatherState.menuOpen}>
    ☰
</button>

{#if weatherState.menuOpen}
    <MobileMenu />
{/if}