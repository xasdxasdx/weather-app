<script lang="ts">
    import '$lib/styles/weather.css';
    let { name, temp, feelsLike, low, high } = $props();
</script>

<section class="glass-panel current-weather centered">
    <h2>{name}</h2>
    <div class="big-temp">{temp}°C</div>
    
    <div class="temp-sub-info">
        <span class="feels-like">Feels like {feelsLike}°</span>
        <div class="daily-range">
            <span>H: {high !== undefined ? Math.round(high) : '--'}°</span> 
            <span>L: {low !== undefined ? Math.round(low) : '--'}°</span>
        </div>
    </div>
</section>