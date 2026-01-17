<script lang="ts">
    import FavoriteCard from './FavoriteCard.svelte';
    import { weatherState } from '$lib/weather.svelte';
    import { favorites, saveFavorite } from '$lib/favorites.svelte';

    let { isMobile = false } = $props();
</script>

<div class="sidebar-content">
    <input 
        placeholder="Search city..." 
        bind:value={weatherState.query} 
        onkeydown={(e) => e.key === 'Enter' && (weatherState.menuOpen = false)}
    />

    <button class="add-fav-btn" onclick={() => saveFavorite(weatherState.query)}>
        <span class="icon">⭐</span> Add to Favorites
    </button>

    <nav class="favorites-list">
        <h3>Favorites</h3>
        <div class="scroll-v">
            {#each favorites as fav (fav.id)}
                <FavoriteCard {fav} forceEditStyle={isMobile} />
            {/each}
        </div>
    </nav>
</div>