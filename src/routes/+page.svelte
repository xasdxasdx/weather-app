<script lang="ts">
    import { supabase } from '$lib/supabase';
    import IconClose from '$lib/icons/IconClose.svelte';

    interface WeatherData {
        name: string;
        temp: number;
        feels_like: number;
        humidity: number;
        wind: number;
        code: number;
        hourly: Array<{ time: string, temp: number, code: number }>;
        daily: Array<{ date: string, max: number, min: number, code: number }>;
    }

    const WEATHER_MAP: Record<string, { codes?: number[], check?: (c: number) => boolean, desc: string, icon: string, bg: string }> = {
        sunny: { codes: [0], desc: 'Clear sky', icon: '☀️', bg: '/backgrounds/sunny.jpg' },
        cloudy: { codes: [1, 2, 3], desc: 'Cloudy', icon: '🌤️', bg: '/backgrounds/cloudy.jpg' },
        foggy: { codes: [45, 48], desc: 'Foggy', icon: '🌫️', bg: '/backgrounds/cloudy.jpg' },
        rainy: { 
            check: (c: number) => (c >= 51 && c <= 67) || (c >= 80 && c <= 82), 
            desc: 'Rainy', icon: '🌧️', bg: '/backgrounds/rainy.jpg' 
        },
        snowy: { codes: [71, 72, 73, 74, 75, 77], desc: 'Snowy', icon: '❄️', bg: '/backgrounds/snowy.jpg' },
        storm: { codes: [95, 99], desc: 'Storm', icon: '⛈️', bg: '/backgrounds/rainy.jpg' }
    };

    const DEFAULT_THEME = { desc: 'Cloudy', icon: '☁️', bg: '/backgrounds/default.jpg' };

    function getWeatherInfo(code: number | undefined) {
        if (code === undefined) return DEFAULT_THEME;
        const found = Object.values(WEATHER_MAP).find(t => 
            (t.codes?.includes(code)) || (t.check?.(code))
        );
        return found || DEFAULT_THEME;
    }

    let query = $state('Milan');
    let weather = $state<WeatherData | null>(null);
    let loading = $state(false);
    let favorites = $state<any[]>([]);
    let menuOpen = $state(false);
    let favoritesWeather = $state<Record<string, any>>({});
    let isEditing = $state(false);

    let theme = $derived(getWeatherInfo(weather?.code));

    async function fetchBriefWeather(cityName: string) {
        try {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=en&format=json`);
            const geoData = await geoRes.json();
            if (!geoData.results) return null;
            const { latitude, longitude } = geoData.results[0];
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
            const data = await res.json();
            return {
                temp: Math.round(data.current.temperature_2m),
                max: Math.round(data.daily.temperature_2m_max[0]),
                min: Math.round(data.daily.temperature_2m_min[0]),
                code: data.current.weather_code
            };
        } catch (e) { return null; }
    }

    async function fetchWeather() {
        if (query.length < 2) return;
        loading = true;
        try {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1&language=en&format=json`);
            const geoData = await geoRes.json();
            if (!geoData.results) return;
            const { latitude, longitude, name } = geoData.results[0];
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
            const data = await weatherRes.json();
            const now = new Date();
            const localHourString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:00`;
            const startIndex = data.hourly.time.findIndex((t: string) => t === localHourString);
            const finalIndex = startIndex !== -1 ? startIndex : 0;

            weather = {
                name,
                temp: Math.round(data.current.temperature_2m),
                feels_like: Math.round(data.current.apparent_temperature),
                humidity: data.current.relative_humidity_2m,
                wind: data.current.wind_speed_10m,
                code: data.current.weather_code,
                hourly: data.hourly.time.slice(finalIndex, finalIndex + 24).map((time: string, i: number) => ({
                    time: time.split('T')[1],
                    temp: Math.round(data.hourly.temperature_2m[i + finalIndex]),
                    code: data.hourly.weather_code[i + finalIndex]
                })),
                daily: data.daily.time.map((date: string, i: number) => ({
                    date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                    max: Math.round(data.daily.temperature_2m_max[i]),
                    min: Math.round(data.daily.temperature_2m_min[i]),
                    code: data.daily.weather_code[i]
                }))
            };
        } catch (e) { console.error(e); } finally { loading = false; }
    }

    async function saveFavorite() {
        if (!weather) return;
        await supabase.from('favorites').insert([{ name: weather.name }]);
        loadFavorites();
    }

    async function loadFavorites() {
        const { data } = await supabase.from('favorites').select('*');
        favorites = data || [];
        for (const fav of favorites) {
            if (!favoritesWeather[fav.name]) {
                const w = await fetchBriefWeather(fav.name);
                if (w) favoritesWeather[fav.name] = w;
            }
        }
    }

    async function removeFavorite(id: number | string) {
        const { error } = await supabase.from('favorites').delete().eq('id', id);
        if (!error) favorites = favorites.filter(fav => fav.id !== id);
    }

    let timer: any;
    let interval: any;
    
    $effect(() => {
        loadFavorites();
        if (query.length >= 2) {
            timer = setTimeout(() => {
                fetchWeather();
                interval = setInterval(fetchWeather, 1800000);
            }, 500);
        }
        return () => { clearTimeout(timer); clearInterval(interval); };
    });
</script>

<div class="theme-wrapper" style="background-image: url({theme.bg})">
    <aside class="sidebar glass-panel">
        <header class="sidebar-header">
            <h1>Weather</h1>
        </header>

        <input placeholder="Search city..." bind:value={query} />

        <button class="add-fav-btn" onclick={saveFavorite}>
            <span class="icon">⭐</span> Add to Favorites
        </button>

        <nav class="favorites-list">
            <h3>Favorites</h3>
            <div class="scroll-v">
                {#each favorites as fav (fav.id)}
                    {@const favInfo = getWeatherInfo(favoritesWeather[fav.name]?.code)}
                    <div class="fav-card">
                        <button class="fav-main-info" onclick={() => { query = fav.name; menuOpen = false; }}>
                            <div class="fav-left">
                                <span class="fav-city-name">{fav.name}</span>
                                <span class="fav-condition">
                                    {favoritesWeather[fav.name] ? favInfo.desc : 'Loading...'}
                                </span>
                            </div>
                            
                            <div class="fav-right">
                                {#if favoritesWeather[fav.name]}
                                    <span class="fav-current-temp">{favoritesWeather[fav.name].temp}°</span>
                                    <span class="fav-hi-lo">
                                        H:{favoritesWeather[fav.name].max}° L:{favoritesWeather[fav.name].min}°
                                    </span>
                                {/if}
                            </div>
                        </button>
                        <button class="del-btn-overlay" onclick={() => removeFavorite(fav.id)}>
                            <IconClose />
                        </button>
                    </div>
                {/each}
            </div>
        </nav>
    </aside>

    <main class="main-content">
        {#if weather}
            <section class="glass-panel current-weather centered">
                <h2>{weather.name}</h2>
                <div class="big-temp">{weather.temp}°C</div>
                
                <div class="temp-sub-info">
                    <div class="feels-like">{theme.desc} | Feels like {weather.feels_like}°</div>
                    <div class="daily-range">
                        <span>H: {weather.daily[0].max}°</span> 
                        <span>L: {weather.daily[0].min}°</span>
                    </div>
                </div>

                <div class="details">
                    <span>💧 {weather.humidity}%</span>
                    <span>💨 {weather.wind} km/h</span>
                </div>
            </section>

            <section class="glass-panel">
                <h3>Hourly</h3>
                <div class="scroll-h">
                    {#each weather.hourly as h}
                        <div class="hour-card">
                            <strong class="hour-temp">{h.temp}°</strong>
                            <span class="hour-icon">{getWeatherInfo(h.code).icon}</span> 
                            <span class="hour-time">{h.time}</span>
                        </div>
                    {/each}
                </div>
            </section>

            <section class="glass-panel">
                <h3>7-Day Forecast</h3>
                <div class="scroll-v" style="max-height: 200px;">
                    {#each weather.daily as d}
                        <div class="day-row">
                            <span>{d.date}</span>
                            <span>{getWeatherInfo(d.code).icon}</span>
                            <span>{d.max}° / {d.min}°</span>
                        </div>
                    {/each}
                </div>
            </section>
        {/if}
    </main>
</div>

<button
    class="burger-btn"
    aria-label="Open menu"
    onclick={() => menuOpen = !menuOpen}
>
    ☰
</button>

{#if menuOpen}
    <div class="mobile-menu">
        <div class="menu-top-bar">
            <h2>Settings & Cities</h2>
            <div class="controls-group">
                <button 
                    class="edit-btn {isEditing ? 'active' : ''}" 
                    onclick={() => isEditing = !isEditing}
                >
                    {isEditing ? '✅' : '⚙️'}
                </button>
                <button class="close-menu-top" onclick={() => { menuOpen = false; isEditing = false; }}>
                    <IconClose />
                </button>
            </div>
        </div>

        <div class="sidebar">
            <input 
                placeholder="Search city..." 
                bind:value={query} 
                onkeydown={(e) => e.key === 'Enter' && (menuOpen = false)}
            />

            <button class="add-fav-btn" onclick={saveFavorite}>
                <span class="icon">⭐</span> Add to Favorites
            </button>

            <nav class="favorites-list">
                <h3>Favorites</h3>
                <div class="scroll-v">
                    {#each favorites as fav (fav.id)}
                        {@const favInfo = getWeatherInfo(favoritesWeather[fav.name]?.code)}
                        
                        <div class="fav-card {isEditing ? 'shaking' : ''}">
                            <button class="fav-main-info" onclick={() => { if(!isEditing) { query = fav.name; menuOpen = false; } }}>
                                <div class="fav-left">
                                    <span class="fav-city-name">{fav.name}</span>
                                    <span class="fav-condition">
                                        {favoritesWeather[fav.name] ? favInfo.desc : 'Loading...'}
                                    </span>
                                </div>
                                
                                <div class="fav-right">
                                    {#if favoritesWeather[fav.name]}
                                        <span class="fav-current-temp">
                                            {favInfo.icon} {favoritesWeather[fav.name].temp}°
                                        </span>
                                        <span class="fav-hi-lo">
                                            H:{favoritesWeather[fav.name].max}° L:{favoritesWeather[fav.name].min}°
                                        </span>
                                    {/if}
                                </div>
                            </button>

                            {#if isEditing}
                                <button class="del-btn-visible" onclick={() => removeFavorite(fav.id)}>
                                    <IconClose />
                                </button>
                            {/if}
                        </div>
                    {/each}
                </div>
            </nav>
        </div>
    </div>
{/if}

<style>
	:global(body) {
        margin: 0;
        font-family: 'Inter', sans-serif;
        
    }

    .theme-wrapper {
        display: grid;
        grid-template-columns: minmax(280px, 20%) 1fr;
        gap: 2vw;
        min-height: 100dvh;
        padding: clamp(12px, 3vw, 30px);
        background-size: cover;
        background-position: center;
        transition: all 0.8s ease-in-out;
        box-sizing: border-box;
    }

    :root {
        --btn-bg: rgba(255, 255, 255, 0.1);
        --btn-hover: rgba(255, 255, 255, 0.2);
        --btn-border: rgba(255, 255, 255, 0.2);
    }

    .add-fav-btn {
        background: var(--btn-bg);
        border: 1px solid var(--btn-border);
        backdrop-filter: blur(10px);
        color: var(--text);
        padding: 12px 24px;
        border-radius: 16px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
        margin-top: 20px;
    }

    .add-fav-btn:hover {
        background: var(--btn-hover);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    }

    .add-fav-btn:active {
        transform: translateY(0);
    }

    .glass-panel {
        background: rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(25px) saturate(160%);
        -webkit-backdrop-filter: blur(25px) saturate(160%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 28px;
        padding: 25px;
        color: #ffffff;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    }

    .main-content {
        display: flex;
        flex-direction: column;
        gap: 20px;
        min-width: 0;
    }

    .hour-card { 
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        text-align: center; 
        background: rgba(255, 255, 255, 0.12);
        min-width: 85px;
        padding: 10px; 
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px; 
    }

    .hour-temp {
        font-size: 1.4rem;
        font-weight: 700;
    }

    .hour-time {
        font-size: 0.85rem;
        opacity: 0.7;
    }

    .day-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    input {
        width: 100%;
        padding: 12px 16px;
        border-radius: 14px;
        border: 1px solid var(--btn-border);
        background: rgba(255, 255, 255, 0.05);
        color: var(--text);
        outline: none;
        transition: all 0.3s;
        margin-bottom: 20px;
        box-sizing: border-box;
    }

    input::placeholder {
        color: var(--text-color);
        opacity: 0.6;
    }

    input:focus {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.5);
        box-shadow: 0 0 15px rgba(255,255,255,0.05);
    }

    .centered { 
        align-items: center; 
        text-align: center; 
        justify-content: center; 
    }

    .big-temp { font-size: 5rem; 
        font-weight: 800; 
        line-height: 1; 
        margin: 10px 0; 
    }

    .scroll-h {
        display: flex;
        overflow-x: auto;
        gap: 12px;
        padding-bottom: 10px;
    }

    .scroll-v {
        overflow-y: auto;
        flex-grow: 1;
        padding-right: 5px;
    }

    ::-webkit-scrollbar { 
        width: 4px; 
        height: 4px; 
    }

    ::-webkit-scrollbar-thumb { 
        background: rgba(255,255,255,0.3); 
        border-radius: 10px; 
    }

    .burger-btn {
        position: fixed;
        right: 16px;
        bottom: 16px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: rgba(0,0,0,0.6);
        color: white;
        border: none;
        font-size: 1.6rem;
        z-index: 1000;
    }

    .mobile-menu {
        color: #ffffff;
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100dvh;
        background: rgba(15, 20, 25, 0.95);
        backdrop-filter: blur(20px);
        z-index: 2000;
        display: flex;
        flex-direction: column;
        padding: 40px 24px;
        box-sizing: border-box;
        overflow-y: auto;
    }

    .mobile-menu h2 {
        font-size: 2rem;
        margin-bottom: 30px;
        text-align: center;
    }

    .mobile-menu .sidebar {
        display: flex !important;
        flex-direction: column;
        gap: 20px;
        background: none;
        border: none;
        padding: 0;
    }

    .close-menu-top {
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255,255,255,0.1);
        border: none;
        color: white;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    .fav-card {
        position: relative;
        margin-bottom: 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        transition: transform 0.2s;
        overflow: hidden;
    }

    .fav-card:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
    }

    .fav-main-info {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 16px;
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        text-align: left;
    }

    .fav-left {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .fav-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
    }

    .fav-city-name {
        font-size: 1.5rem;
        font-weight: 700;
    }

    .fav-current-temp {
        font-size: 1.5rem;
        font-weight: 700;
    }

    .fav-condition {
        font-size: 0.85rem;
        opacity: 0.8;
        text-transform: capitalize;
    }

    .fav-hi-lo {
        font-size: 0.85rem;
        opacity: 0.8;
    }

    .del-btn-overlay {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(255, 77, 77, 0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s;
    }

    .fav-card:hover .del-btn-overlay {
        opacity: 1;
    }

    .temp-sub-info {
        margin-top: -10px;
        margin-bottom: 20px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        opacity: 0.9;
    }

    .feels-like {
        font-size: 1.1rem;
        font-weight: 500;
    }

    .daily-range {
        font-size: 0.95rem;
        font-weight: 400;
        display: flex;
        gap: 12px;
        justify-content: center;
        opacity: 0.8;
    }

    .menu-top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        width: 100%;
    }

    .menu-top-bar h2 {
        margin: 0;
        font-size: 1.8rem;
    }

    .controls-group {
        display: flex;
        gap: 12px;
    }

    .close-menu-top, .edit-btn {
        position: static;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1.2rem;
        transition: all 0.2s;
    }

    .edit-btn.active {
        background: #4caf50;
        box-shadow: 0 0 15px rgba(76, 175, 80, 0.4);
    }

    .del-btn-visible {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ff4d4d;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid #0f1419;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
    }

    .shaking {
        animation: shake 0.3s infinite;
    }

    @keyframes shake {
        0% { transform: rotate(0deg); }
        25% { transform: rotate(0.5deg); }
        75% { transform: rotate(-0.5deg); }
        100% { transform: rotate(0deg); }
    }

    @media (min-width: 769px) {
        .burger-btn,
        .mobile-menu {
            display: none;
        }
    }

    @media (max-width: 768px) {
        .theme-wrapper {
            grid-template-columns: 1fr;
            padding: 12px;
        }

        .big-temp {
            font-size: 3.5rem;
        }

        .sidebar {
            display: none;
        }
    }
</style>