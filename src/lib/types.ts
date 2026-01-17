export interface WeatherData {
    name: string;
    temp: number;
    feels_like: number;
    humidity: number;
    wind: number;
    code: number;
    max?: number; 
    min?: number;
    hourly: Array<{ time: string, temp: number, code: number }>;
    daily: Array<{ date: string, max: number, min: number, code: number }>;
}

export interface WeatherTheme {
    desc: string;
    icon: string;
    bg: string;
}

export interface WeatherConfig extends WeatherTheme {
    codes?: number[];
    check?: (c: number) => boolean;
}