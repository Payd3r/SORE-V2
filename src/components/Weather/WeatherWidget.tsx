'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Cloud, CloudRain, CloudSnow, Zap, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { type WeatherData } from '@/lib/weather/weather-service';

const getWeatherIcon = (iconCode: string) => {
  if (iconCode.startsWith('01')) return <Sun className="w-8 h-8 text-yellow-500" />;
  if (iconCode.startsWith('02') || iconCode.startsWith('03') || iconCode.startsWith('04')) return <Cloud className="w-8 h-8 text-gray-500" />;
  if (iconCode.startsWith('09') || iconCode.startsWith('10')) return <CloudRain className="w-8 h-8 text-blue-500" />;
  if (iconCode.startsWith('11')) return <Zap className="w-8 h-8 text-yellow-400" />;
  if (iconCode.startsWith('13')) return <CloudSnow className="w-8 h-8 text-blue-200" />;
  return <Sun className="w-8 h-8 text-yellow-500" />;
};

const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  return response.json();
};

export function WeatherWidget() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLocationError(null);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Geolocation access denied.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("The request to get user location timed out.");
            break;
          default:
            setLocationError("An unknown error occurred while getting location.");
            break;
        }
      }
    );
  }, []);

  const { data: weatherData, isLoading, isError, error } = useQuery<WeatherData, Error>({
    queryKey: ['weather', location],
    queryFn: () => fetchWeather(location!.lat, location!.lon),
    enabled: !!location,
  });

  if (locationError) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Meteo Attuale</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <AlertTriangle className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-sm text-gray-600">{locationError}</p>
                <p className="text-xs text-gray-400 mt-1">Per favore, abilita la geolocalizzazione per vedere il meteo.</p>
            </CardContent>
        </Card>
    )
  }

  if (!location || isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Meteo Attuale</CardTitle>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
            </CardContent>
        </Card>
    );
  }

  if (isError) {
     return (
        <Card>
            <CardHeader>
                <CardTitle>Meteo Attuale</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2" />
                <p className="text-sm text-gray-600">Impossibile caricare il meteo.</p>
                <p className="text-xs text-gray-400 mt-1">{error?.message}</p>
            </CardContent>
        </Card>
    )
  }

  if (!weatherData) return null;

  const { current, daily } = weatherData;
  const today = daily[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meteo Attuale</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getWeatherIcon(current.weather[0].icon)}
            <div>
              <p className="text-2xl font-bold">{Math.round(current.temp)}°F</p>
              <p className="text-sm text-gray-600 capitalize">{current.weather[0].description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm">Max: {Math.round(today.temp.max)}°F</p>
            <p className="text-sm">Min: {Math.round(today.temp.min)}°F</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 