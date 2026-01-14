<script lang="ts">
	import { supabase } from '$lib/supabase';

	interface WeatherData {
		name: string;
		temp: number;
		humidity: number;
	}

	let query = $state('Milan');
	let weather = $state<WeatherData | null>(null);
	let loading = $state(false);
	let favorites = $state<any[]>([]);
    let errorMessage = $state('');

	async function fetchWeather() {
    loading = true;
    errorMessage = '';
    weather = null;

    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();
        
        if (!geoData.results) {
            errorMessage = 'City not found. Please try another name.';
            return;
        }
        
        const { latitude, longitude, name } = geoData.results[0];
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m`);
        const weatherData = await weatherRes.json();
        
        weather = {
            name,
            temp: weatherData.current.temperature_2m,
            humidity: weatherData.current.relative_humidity_2m
        };
    } catch (e) {
        errorMessage = 'Connection error. Check your internet.';
    } finally {
        loading = false;
    }
}

	async function saveFavorite() {
		if (!weather) return;
		const { error } = await supabase
			.from('favorites')
			.insert([{ name: weather.name }]);
		
		if (!error) loadFavorites();
	}

	async function loadFavorites() {
		const { data } = await supabase.from('favorites').select('*');
		favorites = data || [];
	}

	$effect(() => {
		fetchWeather();
		loadFavorites();
	});

    let isDark = $state(false);

    function toggleTheme() {
        isDark = !isDark;
        if (isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    async function removeFavorite(id: number | string) {
    const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error during deletion:', error);
        alert('Failed to delete city');
    } else {
        favorites = favorites.filter(fav => fav.id !== id);
    }
}
</script>

<div class="theme-wrapper" class:dark={isDark}>
    <header>
        <h1>Weather Search</h1>

        <button onclick={toggleTheme} class="theme-toggle">
            {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>

    </header>

    <main>
        <div class="search">
            <input bind:value={query} placeholder="Enter city..." />
            <button onclick={fetchWeather} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
            </button>
        </div>

        {#if errorMessage}
            <div class="error-badge">
                {errorMessage}
            </div>
        {/if}

        {#if weather}
            <div class="card">
                <h2>{weather.name}</h2>
                <p class="temp">{weather.temp}°C</p>
                <p>Humidity: {weather.humidity}%</p>
                <button onclick={saveFavorite}>⭐ Add to Favorites</button>
            </div>
        {/if}

        <section>
        <h3>Favorites</h3>
        <ul>
            {#each favorites as fav (fav.id)}
                <li class="fav-item">
                    <button 
                        class="link-button" 
                        onclick={() => {
                            query = fav.name; 
                            fetchWeather();
                        }}
                    >
                        {fav.name}
                    </button>
                    
                    <button class="delete-btn" onclick={() => removeFavorite(fav.id)}>
                        &times;
                    </button>
                </li>
            {/each}
        </ul>
        </section>
    </main>
</div>

<style>
	.card {
		border: 1px solid #ccc;
		padding: 20px;
		border-radius: 8px;
		max-width: 300px;
		margin-top: 20px;
		box-shadow: 0 2px 10px rgba(0,0,0,0.1);
	}

	.temp { font-size: 2rem; font-weight: bold; }

    .link-button {
    background: none;
    border: none;
    color: var(--text-color); 
    text-decoration: none;
    cursor: pointer;
    padding: 0;
    font: inherit;
    transition: color 0.3s ease;
    }

    .link-button:hover {
        color: #007bff; 
    }

    li {
        margin-bottom: 8px;
        list-style: none;
    }

    .theme-wrapper {
        --bg-color: #ffffff;
        --text-color: #333333;
        --card-bg: #f9f9f9;
        --input-bg: #ffffff;
        --border-color: #dddddd;
        
        min-height: 100vh;
        background-color: var(--bg-color);
        color: var(--text-color);
        transition: all 0.3s ease;
        padding: 20px;
    }

    .theme-wrapper.dark {
        --bg-color: #1a1a1a;
        --text-color: #f0f0f0;
        --card-bg: #2d2d2d;
        --input-bg: #3d3d3d;
        --border-color: #444444;
    }

    header {
    display: flex;
    justify-content: space-between; 
    align-items: center;
    margin-bottom: 20px;
    }

    header h1 {
        margin: 0;
        font-size: 1.5rem;
    }

    .theme-toggle {
        padding: 8px 16px;
        cursor: pointer;
        border-radius: 20px;
        border: 1px solid var(--border-color);
        background: var(--card-bg);
        color: var(--text-color);
        font-weight: bold;
    }

    .card {
        background-color: var(--card-bg);
        border: 1px solid var(--border-color);
        color: var(--text-color);
        padding: 20px;
        border-radius: 12px;
    }

    input {
        background-color: var(--input-bg);
        color: var(--text-color);
        border: 1px solid var(--border-color);
        padding: 10px;
        border-radius: 6px;
    }

    :global(body.dark-mode) {
        background-color: #1a1a1a;
    }

    .error-badge {
    background-color: #ffe6e6;
    color: #cc0000;
    padding: 10px;
    border-radius: 6px;
    margin: 10px 0;
    border: 1px solid #ffcccc;
    font-size: 0.9rem;
    text-align: center;
    }

    .dark .error-badge {
    background-color: #442222;
    color: #ff8888;
    border-color: #663333;
    }

</style>