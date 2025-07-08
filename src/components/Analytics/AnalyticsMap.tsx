'use client';

import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Fix for default icon issues with webpack
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface Coordinate {
    lat: number;
    lng: number;
    title: string;
    date: Date;
}

interface AnalyticsMapProps {
    coordinates: Coordinate[];
    className?: string;
}

export function AnalyticsMap({ coordinates, className = '' }: AnalyticsMapProps) {
    if (coordinates.length === 0) {
        return (
            <div className={`flex items-center justify-center h-full bg-gray-100 rounded-lg ${className}`}>
                <p className="text-gray-500">Nessun dato di localizzazione disponibile.</p>
            </div>
        );
    }

    const center: [number, number] = [coordinates[0].lat, coordinates[0].lng];

    return (
        <MapContainer center={center} zoom={5} scrollWheelZoom={true} className={`h-96 w-full rounded-lg ${className}`}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MarkerClusterGroup>
                {coordinates.map((coord, index) => (
                    <Marker key={index} position={[coord.lat, coord.lng]}>
                        <Tooltip>
                            <strong>{coord.title}</strong>
                            <br />
                            {new Date(coord.date).toLocaleDateString('it-IT')}
                        </Tooltip>
                    </Marker>
                ))}
            </MarkerClusterGroup>
        </MapContainer>
    );
} 