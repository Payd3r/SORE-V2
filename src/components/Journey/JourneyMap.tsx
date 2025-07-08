'use client';

import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { latLngBounds } from 'leaflet';
import { useEffect } from 'react';

// Fix for default icon issue with webpack
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface Memory {
    id: string;
    title: string;
    latitude: string | null;
    longitude: string | null;
}

interface JourneyMapProps {
  memories: Memory[];
  selectedMemoryId: string | null;
}

// Component to automatically adjust map bounds
function AutoFitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (Array.isArray(bounds) && bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);
  return null;
}

export default function JourneyMap({ memories, selectedMemoryId }: JourneyMapProps) {
  const memoriesWithCoords = memories.filter(
    (m) => m.latitude && m.longitude
  ).map(m => ({
      ...m,
      latitude: parseFloat(m.latitude!),
      longitude: parseFloat(m.longitude!)
  }));

  if (memoriesWithCoords.length === 0) {
    return (
        <div className="flex items-center justify-center h-full bg-gray-100">
            <p>Nessun ricordo con dati di localizzazione per questo viaggio.</p>
        </div>
    );
  }

  const positions: L.LatLngExpression[] = memoriesWithCoords.map(m => [m.latitude, m.longitude]);
  const bounds = latLngBounds(positions);
  
  return (
    <MapContainer center={[memoriesWithCoords[0].latitude, memoriesWithCoords[0].longitude]} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {memoriesWithCoords.map((memory) => (
        <Marker key={memory.id} position={[memory.latitude, memory.longitude]}>
          <Tooltip permanent={selectedMemoryId === memory.id} direction="top">
            {memory.title}
          </Tooltip>
        </Marker>
      ))}

      <Polyline positions={positions} color="blue" />
      
      <AutoFitBounds bounds={bounds} />

    </MapContainer>
  );
} 