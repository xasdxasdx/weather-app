<script lang="ts">
    import IconClose from '$lib/icons/IconClose.svelte';
    import { weatherState, updateWeather, getWeatherInfo } from '$lib/weather.svelte';
    import { favoritesWeather, removeFavorite } from '$lib/favorites.svelte';
    import '$lib/styles/favorites.css';

    let { fav, forceEditStyle = false } = $props();

    let data = $derived(favoritesWeather[fav.name]);
    let info = $derived(getWeatherInfo(data?.code));
</script>

<div class="fav-card {forceEditStyle && weatherState.isEditing ? 'shaking' : ''}">
    <button class="fav-main-info" onclick={() => { 
        if(!weatherState.isEditing) { 
            weatherState.query = fav.name; 
            weatherState.menuOpen = false; 
            updateWeather();
        } 
    }}>
        <div class="fav-left">
            <span class="fav-city-name">{fav.name}</span>
            <span class="fav-condition">{data ? info.desc : 'Loading...'}</span>
        </div>
        {#if data}
            <div class="fav-right">
                <span class="fav-current-temp">{info.icon} {data.temp}°</span>
                <span class="fav-hi-lo">H:{data.max}° L:{data.min}°</span>
            </div>
        {/if}
    </button>

    {#if weatherState.isEditing || !forceEditStyle}
        <button 
            class={weatherState.isEditing ? "del-btn-visible" : "del-btn-overlay"} 
            onclick={() => removeFavorite(fav.id)}
        >
            <IconClose />
        </button>
    {/if}
</div>