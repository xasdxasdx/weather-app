<script lang="ts">
    import { weatherState } from '$lib/weather.svelte';
    import CurrentWeather from '$lib/components/weather/CurrentWeather.svelte';
    import HourlyForecast from '$lib/components/weather/HourlyForecast.svelte';
    import DailyForecast from '$lib/components/weather/DailyForecast.svelte';
</script>

<main class="main-content">
    {#if weatherState.weather}
        {@const w = weatherState.weather}
        
        <CurrentWeather 
            name={w.name} 
            temp={w.temp}
            feelsLike={w.feels_like}
            low={w.daily?.[0]?.min}  
            high={w.daily?.[0]?.max}
        />

        <HourlyForecast items={w.hourly} />

        <DailyForecast items={w.daily} />
    {/if}
</main>