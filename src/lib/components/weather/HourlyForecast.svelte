<script lang="ts">
    import { getWeatherInfo } from '$lib/weather.svelte';
    import '$lib/styles/weather.css';
    
    let { items }: { items: any[] } = $props();
</script>

<section class="glass-panel">
    <h3>Hourly</h3>
    <div class="scroll-h">
        {#each items as h}
            <div class="hour-card">
                <strong class="hour-temp">{h.temp}°</strong>
                <span class="hour-icon">{getWeatherInfo(h.code).icon}</span> 
                <span class="hour-time">{h.time}</span>
            </div>
        {/each}
    </div>
</section>