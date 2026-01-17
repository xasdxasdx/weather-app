<script lang="ts">
    import { getWeatherInfo } from '$lib/weather.svelte';
    import '$lib/styles/weather.css';
    
    let { items }: { items: any[] } = $props();
</script>

<section class="glass-panel">
    <h3>7-Day Forecast</h3>
    <div class="scroll-v">
        {#each items as d}
            <div class="day-row">
                <span class="day-name">{d.date}</span>
                <span class="day-icon">{getWeatherInfo(d.code).icon}</span>
                <span class="day-temp">{d.max}° / {d.min}°</span>
            </div>
        {/each}
    </div>
</section>