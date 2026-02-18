
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { EmergencyAlert, Location } from '../types';
import { useTheme } from './ThemeContext';

// Fix for default Leaflet markers in React
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconShadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

// Emergency Icon (Red) - With Pulse Animation
const EmergencyIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'emergency-marker-pulse'
});

// Community Request Icon (Blue)
const CommunityIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// User Icon (Blue/Standard)
const UserIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

interface MapViewProps {
  alerts: EmergencyAlert[];
  userLocation: Location | null;
  onRespond: (id: string) => void;
}

// Component to re-center map when user location changes and invalidate size
const RecenterMap = ({ lat, lng }: { lat: number, lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
    // Critical fix for "map doesn't open clearly"
    // Invalidates size to force Leaflet to recalculate container dimensions and tile coverage
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [lat, lng, map]);
  return null;
};

const MapView: React.FC<MapViewProps> = ({ alerts, userLocation, onRespond }) => {
  const { isDark } = useTheme();
  const d = isDark;
  const centerLat = userLocation?.lat || 0;
  const centerLng = userLocation?.lng || 0;

  if (!userLocation && alerts.length === 0) {
    return <div className={`h-full flex items-center justify-center ${d ? 'bg-[#0A0E1A] text-slate-500' : 'bg-slate-50 text-slate-400'}`}>Waiting for location...</div>;
  }

  const effectiveCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : (alerts.length > 0 ? [alerts[0].location.lat, alerts[0].location.lng] : [51.505, -0.09]);

  return (
    <div className={`h-[600px] w-full rounded-2xl overflow-hidden border shadow-lg relative z-0 ${d ? 'border-white/10 shadow-black/20' : 'border-slate-200 shadow-slate-200/50'
      }`}>
      <MapContainer
        center={effectiveCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={UserIcon}>
              <Popup>
                <div className="font-bold">You are here</div>
              </Popup>
            </Marker>
            <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />
          </>
        )}

        {alerts.map(alert => (
          <Marker
            key={alert.id}
            position={[alert.location.lat, alert.location.lng]}
            icon={alert.isEmergency !== false ? EmergencyIcon : CommunityIcon}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className={`font-bold ${alert.isEmergency !== false ? 'text-red-600' : 'text-slate-800'}`}>
                  {alert.isEmergency !== false ? 'SOS Alert' : 'Community Request'}
                </h3>
                <span className="text-[10px] uppercase font-bold text-gray-400">{alert.category} • {alert.severity || 'Medium'}</span>
                <p className="font-semibold text-sm mt-1">{alert.userName}</p>
                <p className="text-xs text-gray-600 my-2 line-clamp-2">{alert.description}</p>
                <button
                  onClick={() => onRespond(alert.id)}
                  className={`w-full text-white text-xs py-1 rounded hover:opacity-90 ${alert.isEmergency !== false ? 'bg-red-600' : 'bg-slate-800'}`}
                >
                  Respond
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className={`absolute bottom-4 left-4 p-3 rounded-lg shadow-xl z-[400] text-xs space-y-2 ${d ? 'glass-light' : 'bg-white/90 backdrop-blur-sm border border-slate-200'
        }`}>
        <div className={`font-bold mb-1 ${d ? 'text-white' : 'text-slate-900'}`}>Legend</div>
        <div className={`flex items-center gap-2 ${d ? 'text-slate-300' : 'text-slate-700'}`}>
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png" className="w-3 h-5" />
          <span>You</span>
        </div>
        <div className={`flex items-center gap-2 ${d ? 'text-slate-300' : 'text-slate-700'}`}>
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" className="w-3 h-5" />
          <span>Emergency (SOS)</span>
        </div>
        <div className={`flex items-center gap-2 ${d ? 'text-slate-300' : 'text-slate-700'}`}>
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png" className="w-3 h-5" />
          <span>Community Help</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
