'use client';

import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
// import MarkerClusterGroup from 'react-leaflet-markercluster';
import MarkerClusterGroup from 'react-leaflet-cluster';
// import HeatmapLayer from 'react-leaflet-heatmap-layer-v3';
import { moods } from '@/lib/mood-system';

import L from 'leaflet';
import { useState, useEffect } from 'react';
import axios from 'axios';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface Photo {
    id: string;
    path: string;
    latitude: number;
    longitude: number;
    city: string | null;
    country: string | null;
}

interface MoodMapData {
    lat: number;
    lng: number;
    mood: string;
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    map.setView(center, zoom);
    return null;
}

export default function InteractiveMap() {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [countries, setCountries] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [moodData, setMoodData] = useState<MoodMapData[]>([]);
    // const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
    const [travelRoute, setTravelRoute] = useState<[number, number][]>([]);
    const [showTravelRoute, setShowTravelRoute] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]);
    const [mapZoom, setMapZoom] = useState(13);

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                const response = await fetch('/api/photos');
                const data = await response.json();
                setPhotos(data);
                if (data.length > 0) {
                    setMapCenter([data[0].latitude, data[0].longitude]);
                }

                const uniqueCountries = Array.from(new Set(data.map((p: Photo) => p.country).filter(Boolean))) as string[];
                setCountries(uniqueCountries);

            } catch (error) {
                console.error('Failed to fetch photos:', error);
            }
        };

        const fetchMoodData = async () => {
            try {
                const response = await fetch('/api/mood-map');
                const data = await response.json();
                setMoodData(data);
            } catch (error) {
                console.error('Failed to fetch mood data:', error);
            }
        };

        const fetchTravelRoute = async () => {
            try {
                const response = await fetch('/api/travel-route');
                const data = await response.json();
                setTravelRoute(data);
            } catch (error) {
                console.error('Failed to fetch travel route:', error);
            }
        };

        fetchPhotos();
        fetchMoodData();
        fetchTravelRoute();
    }, []);

    useEffect(() => {
        if (selectedCountry) {
            const citiesForCountry = Array.from(new Set(photos
                .filter(p => p.country === selectedCountry && p.city)
                .map(p => p.city)
            )) as string[];
            setCities(citiesForCountry);
        } else {
            setCities([]);
        }
        setSelectedCity('');
    }, [selectedCountry, photos]);


    const filteredPhotos = photos.filter(photo => {
        if (selectedCity) return photo.city === selectedCity;
        if (selectedCountry) return photo.country === selectedCountry;
        return true;
    });

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery) return;
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
            if (response.data && response.data.length > 0) {
                const { lat, lon } = response.data[0];
                setMapCenter([parseFloat(lat), parseFloat(lon)]);
                setMapZoom(13);
            } else {
                alert('Location not found');
            }
        } catch (error) {
            console.error('Failed to search for location:', error);
            alert('Failed to search for location');
        }
    };

    const heatmapPoints = moodData.map(data => {
        const mood = moods.find(m => m.id === data.mood);
        const intensity = mood ? mood.intensity : 0;
        return [data.lat, data.lng, intensity] as [number, number, number];
    });

    const position: [number, number] = filteredPhotos.length > 0 ? [filteredPhotos[0].latitude, filteredPhotos[0].longitude] : mapCenter;

    return (
        <div>
            <div style={{ padding: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
                    <option value="">All Countries</option>
                    {countries.map(country => <option key={country} value={country}>{country}</option>)}
                </select>
                <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} disabled={!selectedCountry}>
                    <option value="">All Cities</option>
                    {cities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
                {/* <button onClick={() => setShowHeatmap(!showHeatmap)}>
                    {showHeatmap ? 'Hide' : 'Show'} Emotional Heatmap
                </button> */}
                <button onClick={() => setShowTravelRoute(!showTravelRoute)}>
                    {showTravelRoute ? 'Hide' : 'Show'} Travel Route
                </button>
                <a href="/api/export-gpx" download="sore-v2-route.gpx">
                    <button>Export GPX</button>
                </a>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '5px' }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for a location"
                    />
                    <button type="submit">Search</button>
                </form>
            </div>
            <MapContainer center={position} zoom={mapZoom} scrollWheelZoom={false} style={{ height: 'calc(100vh - 120px)', width: '100%' }}>
                <ChangeView center={mapCenter} zoom={mapZoom} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* {showHeatmap && heatmapPoints.length > 0 && (
                    <HeatmapLayer
                        points={heatmapPoints}
                        longitudeExtractor={(p: [number, number, number]) => p[1]}
                        latitudeExtractor={(p: [number, number, number]) => p[0]}
                        intensityExtractor={(p: [number, number, number]) => p[2]}
                        radius={20}
                        blur={15}
                        max={5}
                    />
                )} */}
                {showTravelRoute && travelRoute.length > 1 && (
                    <Polyline positions={travelRoute} color="blue" />
                )}
                <MarkerClusterGroup>
                    {filteredPhotos.map((photo) => (
                        <Marker key={photo.id} position={[photo.latitude, photo.longitude]}>
                            <Tooltip>
                                <img src={photo.path} alt="Memory" style={{ width: '200px', height: 'auto', borderRadius: '8px' }} />
                            </Tooltip>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    );
} 