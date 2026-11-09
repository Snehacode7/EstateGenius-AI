import React, { useEffect, useState } from 'react';
import { Property, PayPalTransaction } from '../types';
import { PropertyGalleryCarousel } from './PropertyGalleryCarousel';
import { PropertyViewer3D } from './PropertyViewer3D';
import {
  X,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  ShieldCheck,
  TrendingUp,
  Box,
  FileText,
  Calculator,
  Star,
  Scale,
  CheckCircle2,
  Share2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Building,
  Camera,
  Heart,
  Check,
} from 'lucide-react';

interface PropertyDetailModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  isStarred?: boolean;
  isCompared?: boolean;
  isFavorited?: boolean;
  onToggleWatchlist?: (id: string) => void;
  onToggleComparison?: (id: string) => void;
  onToggleFavorite?: (property: Property) => void;
  onTriggerPayPal: (tx: PayPalTransaction) => void;
  onSelectPropertyForEmi: (property: Property) => void;
  onSelectPropertyFor3D?: (property: Property, room?: string) => void;
  onSelectPropertyForMap?: (property: Property) => void;
  onAskBrokerAboutProperty: (property: Property) => void;
  onSelectPropertyForAgreement: (property: Property) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  isOpen,
  onClose,
  isStarred = false,
  isCompared = false,
  isFavorited = false,
  onToggleWatchlist,
  onToggleComparison,
  onToggleFavorite,
  onTriggerPayPal,
  onSelectPropertyForEmi,
  onSelectPropertyFor3D,
  onSelectPropertyForMap,
  onAskBrokerAboutProperty,
  onSelectPropertyForAgreement,
}) => {
  const [mediaView, setMediaView] = useState<'gallery' | '3d_staging'>('gallery');
  const [active3DRoom, setActive3DRoom] = useState<string>('Overview');
  const [stagingMode, setStagingMode] = useState<'furnished' | 'empty'>('furnished');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !property) return null;

  const isReserved = property.status !== 'Available';

  const handleLockDeposit = () => {
    if (property.type === 'Rent') {
      const depositAmount = property.deposit || 200;
      onTriggerPayPal({
        action: 'INITIATE_PAYPAL_PAYMENT',
        payment_category: 'RENTAL_DEPOSIT',
        property_id: property.id,
        property_title: property.title,
        amount: depositAmount.toString(),
        currency: 'USD',
        details: `Token Deposit to lock ${property.title} (${property.id}) for 7 days`,
      });
    } else {
      onSelectPropertyForEmi(property);
    }
  };

  // Calculate price per sqft
  const pricePerSqft =
    property.type === 'Rent'
      ? property.rent && property.sqft
        ? (property.rent / property.sqft).toFixed(2)
        : null
      : property.price && property.sqft
      ? Math.round(property.price / property.sqft)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] my-auto">
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-3.5 flex items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="font-mono text-xs font-bold bg-blue-600/90 text-white px-2.5 py-1 rounded-md shrink-0">
              {property.id}
            </span>
            <div className="truncate">
              <h3 className="text-base font-bold text-white truncate">
                {property.title}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{property.location}</span>
                <span className="text-slate-500">·</span>
                <span>{property.category}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Compare Toggle */}
            {onToggleComparison && (
              <button
                type="button"
                onClick={() => onToggleComparison(property.id)}
                title={isCompared ? 'Remove from Comparison' : 'Add to Comparison'}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isCompared
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isCompared ? 'Compared' : 'Compare'}
                </span>
              </button>
            )}

            {/* Watchlist Star Toggle */}
            {onToggleWatchlist && (
              <button
                type="button"
                onClick={() => onToggleWatchlist(property.id)}
                title={isStarred ? 'Remove from Watchlist' : 'Save to Watchlist'}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isStarred
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    isStarred ? 'fill-slate-950 text-slate-950' : 'text-current'
                  }`}
                />
                <span className="hidden sm:inline">
                  {isStarred ? 'Starred' : 'Watchlist'}
                </span>
              </button>
            )}

            {/* Cloud Favorite Toggle */}
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(property)}
                title={isFavorited ? 'Remove from Cloud Favorites (Firestore)' : 'Save to Cloud Favorites (Firestore)'}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isFavorited
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    isFavorited ? 'fill-white text-white' : 'text-current'
                  }`}
                />
                <span className="hidden sm:inline">
                  {isFavorited ? 'Favorited' : 'Favorite'}
                </span>
              </button>
            )}

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          {/* Main Media Container: Photo Gallery or 3D Virtual Staging */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Media Switcher Tab Buttons */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setMediaView('gallery')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    mediaView === 'gallery'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  <span>Photo Gallery</span>
                  <span className="text-[10px] font-mono font-medium text-slate-500">
                    ({property.images?.length || 1})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaView('3d_staging')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    mediaView === '3d_staging'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-blue-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>AI Virtual Staging (3D)</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      mediaView === '3d_staging'
                        ? 'bg-blue-800 text-white'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    Interactive
                  </span>
                </button>
              </div>

              {/* View subtitle / hint */}
              <div className="text-[11px] text-slate-500">
                {mediaView === 'gallery' ? (
                  <span>Swipe photos or click thumbnails to inspect</span>
                ) : (
                  <span className="text-blue-700 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Three.js Spatial Engine · Toggle Empty vs. Furnished</span>
                  </span>
                )}
              </div>
            </div>

            {/* Viewport Rendering */}
            {mediaView === 'gallery' ? (
              <PropertyGalleryCarousel
                property={property}
                mode="detail"
                showThumbnails={true}
                showCaptions={true}
                autoPlayInterval={4500}
              />
            ) : (
              <div className="relative animate-in fade-in duration-200">
                <PropertyViewer3D
                  property={property}
                  compact={true}
                  initialStagingMode={stagingMode}
                  initialRoom={active3DRoom}
                />
              </div>
            )}
          </div>

          {/* Two-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Details, Specs, 3D Rooms, Amenities */}
            <div className="lg:col-span-2 space-y-6">
              {/* Key Specs Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
                    <BedDouble className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Layout</div>
                    <div className="text-xs font-bold text-slate-900">{property.bedrooms}</div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
                    <Bath className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Baths</div>
                    <div className="text-xs font-bold text-slate-900">{property.bathrooms} Baths</div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Area</div>
                    <div className="text-xs font-bold text-slate-900 font-mono">{property.sqft} sq ft</div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-900 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Safety Index</div>
                    <div className="text-xs font-bold text-emerald-700">
                      {property.safetyScore || 9}/10
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Property Overview
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                  {property.description}
                </p>
              </div>

              {/* Interactive 3D Room Virtual Tour & Staging Section */}
              {property.rooms3D && property.rooms3D.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>AI Virtual Staging & Spatial Rooms</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaView('3d_staging');
                        setStagingMode((prev) => (prev === 'furnished' ? 'empty' : 'furnished'));
                      }}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Toggle {stagingMode === 'furnished' ? 'Empty Shell' : 'Furnished State'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {property.rooms3D.map((room) => (
                      <button
                        key={room}
                        type="button"
                        onClick={() => {
                          setActive3DRoom(room);
                          setMediaView('3d_staging');
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          mediaView === '3d_staging' && active3DRoom === room
                            ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                        }`}
                      >
                        <Box className="w-3 h-3 text-current" />
                        <span>Stage {room}</span>
                        <ArrowRight className="w-3 h-3 opacity-60" />
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectPropertyFor3D?.(property, active3DRoom);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer ml-auto"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Full 3D Studio</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Verified Amenities Matrix */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Included Amenities & Features
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {property.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-800"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate font-medium">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Investment & Yield Statistics */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Investment & Growth Projections
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>EstateMind AI Valuation</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60">
                    <div className="text-[10px] text-slate-400">Walkability</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {property.walkScore || 90}/100
                    </div>
                  </div>
                  <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60">
                    <div className="text-[10px] text-slate-400">Rental Yield</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      {property.rentalYield ? `${property.rentalYield}%` : '8.2%'}
                    </div>
                  </div>
                  <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60">
                    <div className="text-[10px] text-slate-400">5-Yr Growth</div>
                    <div className="text-sm font-bold text-blue-400 mt-0.5">
                      {property.fiveYearAppreciation || '+26%'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Pricing & Escrow Action Station */}
            <div className="space-y-4">
              {/* Financial Box */}
              <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {property.type === 'Rent' ? 'Monthly Lease Rate' : 'Asking Purchase Price'}
                  </div>
                  <div className="font-mono text-2xl sm:text-3xl font-extrabold text-blue-900">
                    {property.type === 'Rent'
                      ? `$${property.rent?.toLocaleString()}/mo`
                      : `$${property.price?.toLocaleString()}`}
                  </div>
                  {pricePerSqft && (
                    <div className="text-[11px] text-slate-500">
                      ≈ ${pricePerSqft} {property.type === 'Rent' ? '/ sq ft / month' : '/ sq ft'}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between text-blue-950">
                    <span className="font-medium">
                      {property.type === 'Rent' ? '7-Day Token Deposit' : 'Minimum Downpayment'}
                    </span>
                    <span className="font-mono font-bold">
                      ${(property.type === 'Rent' ? property.deposit || 200 : property.minDownpayment || 20000).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-blue-700">
                    Protected by PayPal Escrow & Digital Smart Contract
                  </div>
                </div>

                {/* Primary PayPal or EMI CTA */}
                {property.type === 'Rent' ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      handleLockDeposit();
                    }}
                    disabled={isReserved}
                    className="w-full bg-[#FFC439] hover:bg-[#F2BA36] disabled:bg-slate-200 text-[#003087] font-bold text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    <span className="italic font-serif text-base">
                      Pay<span className="text-[#0079C1]">Pal</span>
                    </span>
                    <span>Lock Deposit (${property.deposit || 200})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectPropertyForEmi(property);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
                  >
                    <Calculator className="w-4 h-4 text-amber-400" />
                    <span>Calculate Monthly EMI Plan</span>
                  </button>
                )}

                {/* Google Maps Shortcut */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectPropertyForMap?.(property);
                  }}
                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-semibold text-xs py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Inspect on Google Maps</span>
                </button>

                {/* Digital Agreement Draft */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectPropertyForAgreement(property);
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>Generate Digital Contract Draft</span>
                </button>

                {/* Ask AI Broker */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAskBrokerAboutProperty(property);
                  }}
                  className="w-full text-center text-xs text-blue-900 hover:text-blue-950 font-semibold py-1.5 transition-colors cursor-pointer"
                >
                  Ask EstateMind AI broker about this listing →
                </button>
              </div>

              {/* Host & Management Credentials */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  Managing Entity
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
                    {property.ownerName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{property.ownerName}</div>
                    <div className="text-[11px] text-slate-500">Verified Partner Landlord</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
