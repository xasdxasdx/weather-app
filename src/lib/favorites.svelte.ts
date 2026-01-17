import { supabase } from '$lib/supabase';
import type { WeatherData } from '$lib/types';

export const favorites = $state<any[]>([]);
export const favoritesWeather = $state<Record<string, Partial<WeatherData>>>({});

export async function fetchBriefWeather(cityName: string) {
	try {
		const geoRes = await fetch(
			`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=en&format=json`
		);
		const geoData = await geoRes.json();
		if (!geoData.results) return null;

		const { latitude, longitude } = geoData.results[0];

		const res = await fetch(
			`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
		);

		const data = await res.json();

		return {
			temp: Math.round(data.current.temperature_2m),
			max: Math.round(data.daily.temperature_2m_max[0]),
			min: Math.round(data.daily.temperature_2m_min[0]),
			code: data.current.weather_code
		};
	} catch {
		return null;
	}
}

export async function fetchWeather(city: string): Promise<WeatherData | null> {
	if (city.length < 2) return null;

	try {
		const geoRes = await fetch(
			`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`
		);
		const geoData = await geoRes.json();
		if (!geoData.results) return null;

		const { latitude, longitude, name } = geoData.results[0];

		const weatherRes = await fetch(
			`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
		);

		const data = await weatherRes.json();

		const now = new Date();
		const localHourString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:00`;

		const startIndex = data.hourly.time.findIndex((t: string) => t === localHourString);
		const finalIndex = startIndex !== -1 ? startIndex : 0;

		return {
			name,
			temp: Math.round(data.current.temperature_2m),
			feels_like: Math.round(data.current.apparent_temperature),
			humidity: data.current.relative_humidity_2m,
			wind: data.current.wind_speed_10m,
			code: data.current.weather_code,
			hourly: data.hourly.time
				.slice(finalIndex, finalIndex + 24)
				.map((time: string, i: number) => ({
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
	} catch (e) {
		console.error(e);
		return null;
	}
}

export async function loadFavorites() {
	const { data } = await supabase.from('favorites').select('*');

	favorites.length = 0;
	if (!data) return;

	for (const fav of data) {
		favorites.push(fav);

		if (!favoritesWeather[fav.name]) {
			const w = await fetchBriefWeather(fav.name);
			if (w) favoritesWeather[fav.name] = w;
		}
	}
}

export async function saveFavorite(cityName: string) {
	if (!cityName) return;

	await supabase.from('favorites').insert([{ name: cityName }]);
	await loadFavorites();
}

export async function removeFavorite(id: number | string) {
	const { error } = await supabase.from('favorites').delete().eq('id', id);
	if (error) return;

	const index = favorites.findIndex(f => f.id === id);
	if (index !== -1) favorites.splice(index, 1);
}