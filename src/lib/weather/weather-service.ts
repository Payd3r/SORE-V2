import { env } from "../env";

export interface WeatherData {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: CurrentWeather;
  daily: DailyWeather[];
}

export interface CurrentWeather {
  dt: number;
  sunrise: number;
  sunset: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  dew_point: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: WeatherCondition[];
}

export interface DailyWeather {
  dt: number;
  sunrise: number;
  sunset: number;
  moonrise: number;
  moonset: number;
  moon_phase: number;
  summary: string;
  temp: Temp;
  feels_like: FeelsLike;
  pressure: number;
  humidity: number;
  dew_point: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: WeatherCondition[];
  clouds: number;
  pop: number;
  uvi: number;
  rain?: number;
  snow?: number;
}

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface Temp {
  day: number;
  min: number;
  max: number;
  night: number;
  eve: number;
  morn: number;
}

export interface FeelsLike {
  day: number;
  night: number;
  eve: number;
  morn: number;
}

const OPENWEATHERMAP_API_URL = "https://api.openweathermap.org/data/3.0/onecall";

export async function getWeatherForLocation(lat: number, lon: number): Promise<WeatherData> {
  const apiKey = env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    throw new Error("OpenWeatherMap API key is not configured.");
  }

  const url = new URL(OPENWEATHERMAP_API_URL);
  url.searchParams.append("lat", lat.toString());
  url.searchParams.append("lon", lon.toString());
  url.searchParams.append("appid", apiKey);
  url.searchParams.append("units", "imperial"); 
  url.searchParams.append("exclude", "minutely,hourly,alerts");

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch weather data: ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json() as WeatherData;
  return data;
} 