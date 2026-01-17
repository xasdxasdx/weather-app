import type { WeatherData, WeatherTheme, WeatherConfig } from '$lib/types';
import { fetchWeather } from '$lib/favorites.svelte';

export const weatherState = $state({
    query: 'Milan',
    weather: null as WeatherData | null,
    menuOpen: false,
    isEditing: false
});

const WEATHER_MAP: Record<string, WeatherConfig> = {
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

export function getWeatherInfo(code: number | undefined): WeatherTheme {
    if (code === undefined) return DEFAULT_THEME;
    
    const found = Object.values(WEATHER_MAP).find(t => 
        (t.codes?.includes(code)) || (t.check?.(code)));
    return found || DEFAULT_THEME;
}

export async function updateWeather() {
    if (weatherState.query.length < 2) return;
    const data = await fetchWeather(weatherState.query);
    if (data) {
        weatherState.weather = data;
    }
}