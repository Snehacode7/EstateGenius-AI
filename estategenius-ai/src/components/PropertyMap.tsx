import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { Property, MapFocusAction } from '../types';
import { MapPin, Navigation, Bus, Coffee, School, TreePine, Sparkles, X, ExternalLink } from 'lucide-react';

interface PropertyMapProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property) => void;
  targetMapAction?: MapFocusAction | null;
  onLaunch3D?: (property: Property) => void;
  onLockDeposit?: (property: Property) => void;
}

export const PropertyMap: React.FC<PropertyMapProps> = ({
  properties,
  selectedProperty,
  onSelectProperty,
  targetMapAction,
  onLaunch3D,
  onLockDeposit,
}) => {
  // Use Vite client env var or fallback
  const mapsApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || (import.meta as any).env?.GOOGLE_MAPS_API_KEY || '';

  const [activeProperty, setActiveProperty] = useState<Property | null>(selectedProperty || properties[0]);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: selectedProperty?.coordinates.lat || 40.7306,
    lng: selectedProperty?.coordinates.lng || -73.9866,
  });
  const [zoom, setZoom] = useState<number>(13);
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);
  const [amenityFilter, setAmenityFilter] = useState<'all' | 'transit' | 'dining' | 'parks'>('all');

  // Listen to Google Maps quota exceeded event
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Update center when selectedProperty or targetMapAction changes
  useEffect(() => {
    if (targetMapAction?.coordinates) {
      setMapCenter(targetMapAction.coordinates);
      setZoom(15);
      const found = properties.find((p) => p.id === targetMapAction.property_id);
      if (found) setActiveProperty(found);
    } else if (selectedProperty) {
      setMapCenter(selectedProperty.coordinates);
      setActiveProperty(selectedProperty);
    }
  }, [targetMapAction, selectedProperty, properties]);

  // Nearby simulated POIs for rich neighborhood context
  const neighborhoodPOIs = [
    { id: 'poi-1', name: 'Downtown Metro Station (Line 4/5)', type: 'transit', lat: 40.7138, lng: -74.0040, walkMins: 3 },
    { id: 'poi-2', name: 'Artisan Espresso & Roasters', type: 'dining', lat: 40.7118, lng: -74.0080, walkMins: 4 },
    { id: 'poi-3', name: 'Heights Community Park & Dog Run', type: 'parks', lat: 40.7850, lng: -73.9680, walkMins: 5 },
    { id: 'poi-4', name: 'Tech Park High-Speed Commuter Express', type: 'transit', lat: 40.7490, lng: -73.9840, walkMins: 2 },
  ];

  const filteredPOIs = neighborhoodPOIs.filter((poi) =>
    amenityFilter === 'all' ? true : poi.type === amenityFilter
  );

  return (
    <div className="relative w-full h-[620px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-lg flex flex-col">
      {/* Quota Defense Banner (Case A requirement for Demo Key) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs text-center sticky top-0 z-50 shadow-sm flex items-center justify-center gap-2">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
          <button onClick={() => setQuotaExceeded(false)} className="text-amber-700 hover:text-amber-950 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-md pointer-events-auto flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-700" />
          <span className="text-xs font-bold text-slate-900">
            Google Maps Real-World Location Routing
          </span>
        </div>

        {/* Amenity Layer Filters */}
        <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-md pointer-events-auto flex items-center gap-1 text-xs">
          <button
            onClick={() => setAmenityFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              amenityFilter === 'all' ? 'bg-blue-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Amenities
          </button>
          <button
            onClick={() => setAmenityFilter('transit')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              amenityFilter === 'transit' ? 'bg-blue-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bus className="w-3 h-3" /> Transit
          </button>
          <button
            onClick={() => setAmenityFilter('dining')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              amenityFilter === 'dining' ? 'bg-blue-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coffee className="w-3 h-3" /> Dining
          </button>
          <button
            onClick={() => setAmenityFilter('parks')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              amenityFilter === 'parks' ? 'bg-blue-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TreePine className="w-3 h-3" /> Parks
          </button>
        </div>
      </div>

      {/* Google Maps Container */}
      <div className="w-full h-full relative">
        <APIProvider apiKey={mapsApiKey}>
          <Map
            defaultCenter={mapCenter}
            center={mapCenter}
            defaultZoom={zoom}
            zoom={zoom}
            mapId="DEMO_MAP_ID"
            gestureHandling="greedy"
            disableDefaultUI={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Property Advanced Markers */}
            {properties.map((prop) => {
              const isSelected = activeProperty?.id === prop.id;
              return (
                <AdvancedMarker
                  key={prop.id}
                  position={prop.coordinates}
                  onClick={() => {
                    setActiveProperty(prop);
                    onSelectProperty(prop);
                    setMapCenter(prop.coordinates);
                  }}
                  title={prop.title}
                >
                  <div
                    className={`transition-transform duration-200 cursor-pointer ${
                      isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                    }`}
                  >
                    <div
                      className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-lg border flex items-center gap-1.5 ${
                        prop.type === 'Rent'
                          ? 'bg-blue-900 text-white border-blue-400'
                          : 'bg-emerald-800 text-white border-emerald-400'
                      }`}
                    >
                      <MapPin className="w-3 h-3 text-amber-300" />
                      <span>{prop.id}</span>
                      <span className="font-mono-tabular">
                        {prop.type === 'Rent' ? `$${prop.rent}/mo` : `$${Math.round((prop.price || 0) / 1000)}k`}
                      </span>
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* Simulated Neighborhood Amenity Markers */}
            {filteredPOIs.map((poi) => (
              <AdvancedMarker key={poi.id} position={{ lat: poi.lat, lng: poi.lng }} title={poi.name}>
                <div className="bg-white/90 p-1.5 rounded-full shadow-md border border-slate-300 text-slate-700 hover:scale-110 transition-transform">
                  {poi.type === 'transit' ? (
                    <Bus className="w-3.5 h-3.5 text-blue-600" />
                  ) : poi.type === 'dining' ? (
                    <Coffee className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <TreePine className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </div>
              </AdvancedMarker>
            ))}

            {/* Active Property InfoWindow */}
            {activeProperty && (
              <InfoWindow
                position={activeProperty.coordinates}
                onCloseClick={() => setActiveProperty(null)}
              >
                <div className="p-1 max-w-[240px] text-slate-800">
                  <div className="font-bold text-xs text-slate-900">{activeProperty.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {activeProperty.location} · {activeProperty.category}
                  </div>
                  <div className="font-mono-tabular font-bold text-sm text-blue-900 mt-1">
                    {activeProperty.type === 'Rent'
                      ? `$${activeProperty.rent?.toLocaleString()}/mo`
                      : `$${activeProperty.price?.toLocaleString()} USD`}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {onLaunch3D && (
                      <button
                        onClick={() => onLaunch3D(activeProperty)}
                        className="px-2 py-1 text-[10px] font-bold bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        3D Tour
                      </button>
                    )}
                    {onLockDeposit && (
                      <button
                        onClick={() => onLockDeposit(activeProperty)}
                        className="px-2 py-1 text-[10px] font-bold bg-[#FFC439] text-[#003087] rounded-md hover:bg-[#F2BA36] transition-colors cursor-pointer"
                      >
                        PayPal Lock
                      </button>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      {/* Bottom Floating Property Summary Strip */}
      {activeProperty && (
        <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/95 backdrop-blur-md rounded-xl p-3 border border-slate-200 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={activeProperty.image}
              alt={activeProperty.title}
              className="w-12 h-12 rounded-lg object-cover border border-slate-200"
            />
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span>{activeProperty.title}</span>
                <span className="font-mono-tabular text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  {activeProperty.id}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{activeProperty.location}</span>
                <span>·</span>
                <span className="font-mono-tabular font-semibold text-slate-800">
                  {activeProperty.type === 'Rent'
                    ? `$${activeProperty.rent}/mo (Deposit: $${activeProperty.deposit})`
                    : `$${activeProperty.price?.toLocaleString()} (Min Down: $${activeProperty.minDownpayment?.toLocaleString()})`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onLaunch3D && (
              <button
                onClick={() => onLaunch3D(activeProperty)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Launch 3D Scene</span>
              </button>
            )}
            {onLockDeposit && (
              <button
                onClick={() => onLockDeposit(activeProperty)}
                className="px-3 py-1.5 bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Lock with PayPal
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
