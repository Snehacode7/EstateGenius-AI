import React, { useState } from 'react';
import { Property, PayPalTransaction, UserFavoriteItem } from '../types';
import { MarketTrendsChart } from './MarketTrendsChart';
import {
  Search,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  ShieldCheck,
  ArrowRight,
  Calculator,
  FileText,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Download,
  FileSpreadsheet,
  FileCode,
  Check,
  Box,
  Star,
  StarOff,
  Sparkles,
  ExternalLink,
  Scale,
  Eye,
  Camera,
  Heart,
  FolderSync,
} from 'lucide-react';
import { PropertyComparisonModal } from './PropertyComparisonModal';
import { PropertyGalleryCarousel } from './PropertyGalleryCarousel';
import { PropertyDetailModal } from './PropertyDetailModal';

interface PropertyShowcaseProps {
  properties: Property[];
  watchlistIds?: string[];
  userFavorites?: UserFavoriteItem[];
  onToggleWatchlist?: (propertyId: string) => void;
  onToggleFavorite?: (property: Property) => void;
  onOpenFavoritesModal?: () => void;
  onTriggerPayPal: (tx: PayPalTransaction) => void;
  onSelectPropertyForEmi: (property: Property) => void;
  onSelectPropertyForAgreement: (property: Property) => void;
  onAskBrokerAboutProperty: (property: Property) => void;
  onSelectPropertyFor3D?: (property: Property) => void;
  onSelectPropertyForMap?: (property: Property) => void;
  onNavigateTab: (tab: 'chat' | 'properties' | '3d' | 'map' | 'emi' | 'agreements' | 'owner') => void;
}

export const PropertyShowcase: React.FC<PropertyShowcaseProps> = ({
  properties,
  watchlistIds = [],
  userFavorites = [],
  onToggleWatchlist,
  onToggleFavorite,
  onOpenFavoritesModal,
  onTriggerPayPal,
  onSelectPropertyForEmi,
  onSelectPropertyForAgreement,
  onAskBrokerAboutProperty,
  onSelectPropertyFor3D,
  onSelectPropertyForMap,
  onNavigateTab,
}) => {
  const [filterType, setFilterType] = useState<'All' | 'Favorites' | 'Watchlist' | 'Rent' | 'Sale' | 'Commercial'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTrends, setShowTrends] = useState<boolean>(true);
  const [showWatchlistSection, setShowWatchlistSection] = useState<boolean>(true);
  const [chartLocation, setChartLocation] = useState<string>('Downtown');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [comparisonIds, setComparisonIds] = useState<string[]>(['PROP-101', 'PROP-102']);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [comparisonNotice, setComparisonNotice] = useState<string | null>(null);
  const [selectedDetailProperty, setSelectedDetailProperty] = useState<Property | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const handleOpenDetails = (prop: Property) => {
    setSelectedDetailProperty(prop);
    setIsDetailModalOpen(true);
  };

  const handleToggleComparison = (propertyId: string) => {
    if (comparisonIds.includes(propertyId)) {
      setComparisonIds((prev) => prev.filter((id) => id !== propertyId));
    } else {
      if (comparisonIds.length >= 3) {
        setComparisonNotice('You can compare up to 3 properties at a time. Please remove one first.');
        setTimeout(() => setComparisonNotice(null), 3500);
        return;
      }
      setComparisonIds((prev) => [...prev, propertyId]);
    }
  };

  const comparedProperties = properties.filter((p) => comparisonIds.includes(p.id));
  const watchlistProperties = properties.filter((prop) => watchlistIds.includes(prop.id));
  const favoritePropertyIds = userFavorites.map((f) => f.propertyId);
  const favoriteProperties = properties.filter((prop) => favoritePropertyIds.includes(prop.id));

  const filteredProperties = properties.filter((prop) => {
    const isWatchlisted = watchlistIds.includes(prop.id);
    const isFavorited = favoritePropertyIds.includes(prop.id);
    const matchesType =
      filterType === 'All'
        ? true
        : filterType === 'Favorites'
        ? isFavorited
        : filterType === 'Watchlist'
        ? isWatchlisted
        : filterType === 'Commercial'
        ? prop.category === 'Commercial'
        : prop.type === filterType;

    const matchesSearch =
      searchQuery === '' ||
      prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesSearch;
  });

  const handleExportCsv = (onlyWatchlist = false) => {
    const targetProperties = onlyWatchlist ? watchlistProperties : filteredProperties;
    const headers = [
      'Property ID',
      'Title',
      'Type',
      'Category',
      'Location',
      'Rent ($/mo)',
      'Token Deposit ($)',
      'Price ($)',
      'Min Downpayment ($)',
      'Bedrooms',
      'Bathrooms',
      'Square Feet',
      'Status',
      'Owner',
      'Amenities',
      'Description',
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const text = String(str).replace(/"/g, '""');
      return `"${text}"`;
    };

    const rows = targetProperties.map((p) => [
      escapeCsv(p.id),
      escapeCsv(p.title),
      escapeCsv(p.type),
      escapeCsv(p.category),
      escapeCsv(p.location),
      escapeCsv(p.rent || ''),
      escapeCsv(p.deposit || ''),
      escapeCsv(p.price || ''),
      escapeCsv(p.minDownpayment || ''),
      escapeCsv(p.bedrooms),
      escapeCsv(p.bathrooms),
      escapeCsv(p.sqft),
      escapeCsv(p.status),
      escapeCsv(p.ownerName),
      escapeCsv(p.amenities.join('; ')),
      escapeCsv(p.description),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    const prefix = onlyWatchlist ? 'watchlist' : filterType.toLowerCase();
    link.setAttribute('download', `estatemind_${prefix}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(onlyWatchlist ? 'Watchlist CSV exported!' : 'CSV summary downloaded!');
    setShowExportMenu(false);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleExportJson = (onlyWatchlist = false) => {
    const targetProperties = onlyWatchlist ? watchlistProperties : filteredProperties;
    const exportData = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        totalProperties: targetProperties.length,
        filterCategory: onlyWatchlist ? 'Watchlist' : filterType,
        source: 'EstateMind AI Real Estate Operating System',
      },
      properties: targetProperties.map((p) => ({
        id: p.id,
        title: p.title,
        type: p.type,
        category: p.category,
        location: p.location,
        coordinates: p.coordinates,
        financials: {
          monthlyRentUsd: p.rent || null,
          tokenDepositUsd: p.deposit || null,
          purchasePriceUsd: p.price || null,
          minimumDownpaymentUsd: p.minDownpayment || null,
          rentalYieldPercent: p.rentalYield || null,
          fiveYearAppreciation: p.fiveYearAppreciation || null,
        },
        specifications: {
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          squareFeet: p.sqft,
          safetyScore: p.safetyScore || null,
          walkScore: p.walkScore || null,
        },
        status: p.status,
        owner: p.ownerName,
        amenities: p.amenities,
        description: p.description,
      })),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    const prefix = onlyWatchlist ? 'watchlist' : filterType.toLowerCase();
    link.setAttribute('download', `estatemind_${prefix}_${dateStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(onlyWatchlist ? 'Watchlist JSON exported!' : 'JSON summary downloaded!');
    setShowExportMenu(false);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDirectLock = (prop: Property) => {
    if (prop.type === 'Rent') {
      const depositAmount = prop.deposit || 200;
      onTriggerPayPal({
        action: 'INITIATE_PAYPAL_PAYMENT',
        payment_category: 'RENTAL_DEPOSIT',
        property_id: prop.id,
        property_title: prop.title,
        amount: depositAmount.toString(),
        currency: 'USD',
        details: `Token Deposit to lock ${prop.title} (${prop.id}) for 7 days`,
      });
    } else {
      onSelectPropertyForEmi(prop);
      onNavigateTab('emi');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Exclusive Managed Properties
            </h2>
            {watchlistIds.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                <span>{watchlistIds.length} Starred</span>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Broker-verified portfolio with instant PayPal escrow reservations, 3D walkthroughs, and personal Watchlist tracking.
          </p>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by location, ID, or title..."
              className="text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-white w-60 focus:outline-hidden focus:ring-1 focus:ring-blue-600 shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowTrends(!showTrends)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              showTrends
                ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>{showTrends ? 'Hide D3 Trends' : 'Market Trends'}</span>
          </button>

          {/* Compare Launcher Button */}
          <button
            type="button"
            onClick={() => setIsComparisonOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-2xs ${
              comparisonIds.length > 0
                ? 'bg-blue-50 text-blue-900 border-blue-300 font-bold hover:bg-blue-100 ring-1 ring-blue-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-blue-700" />
            <span>Compare ({comparisonIds.length}/3)</span>
          </button>

          {/* Filter Pills with Favorites and Watchlist Option */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            {(['All', 'Favorites', 'Watchlist', 'Rent', 'Sale', 'Commercial'] as const).map((tab) => {
              const isActive = filterType === tab;
              const isFavoritesTab = tab === 'Favorites';
              const isWatchlistTab = tab === 'Watchlist';
              return (
                <button
                  key={tab}
                  onClick={() => setFilterType(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    isActive
                      ? isFavoritesTab
                        ? 'bg-rose-600 text-white font-bold shadow-xs'
                        : isWatchlistTab
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                        : 'bg-white text-slate-900 shadow-xs'
                      : isFavoritesTab
                      ? 'text-rose-700 hover:text-rose-900 hover:bg-rose-50'
                      : isWatchlistTab
                      ? 'text-amber-700 hover:text-amber-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isFavoritesTab && (
                    <Heart
                      className={`w-3 h-3 ${
                        isActive ? 'fill-white text-white' : 'fill-rose-400 text-rose-500'
                      }`}
                    />
                  )}
                  {isWatchlistTab && (
                    <Star
                      className={`w-3 h-3 ${
                        isActive ? 'fill-slate-950 text-slate-950' : 'fill-amber-400 text-amber-500'
                      }`}
                    />
                  )}
                  <span>
                    {tab === 'All'
                      ? 'All Units'
                      : tab === 'Favorites'
                      ? `Favorites (${userFavorites.length})`
                      : tab === 'Watchlist'
                      ? `Watchlist (${watchlistIds.length})`
                      : tab === 'Rent'
                      ? 'For Rent'
                      : tab === 'Sale'
                      ? 'For Sale'
                      : 'Commercial'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Export Summary Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-700" />
              <span>Export ({filteredProperties.length})</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1.5 space-y-1 animate-in fade-in duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Export Current View ({filteredProperties.length})
                </div>
                <button
                  type="button"
                  onClick={() => handleExportCsv(false)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-left font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Download as CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportJson(false)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-left font-medium"
                >
                  <FileCode className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Download as JSON</span>
                </button>

                {watchlistProperties.length > 0 && (
                  <>
                    <div className="border-t border-slate-100 my-1 pt-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                      Watchlist Only ({watchlistProperties.length})
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExportCsv(true)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer text-left font-medium"
                    >
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500 shrink-0" />
                      <span>Export Watchlist CSV</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Download Toast Notification */}
      {downloadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* D3 Market Trends Section */}
      {showTrends && (
        <div id="market-trends-section" className="animate-in fade-in slide-in-from-top-3 duration-300">
          <MarketTrendsChart key={chartLocation} initialLocation={chartLocation} />
        </div>
      )}

      {/* SPECIALIZED WATCHLIST SECTION */}
      {watchlistProperties.length > 0 && filterType !== 'Watchlist' && (
        <section
          id="watchlist-section"
          className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300/80 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs shrink-0">
                <Star className="w-5 h-5 fill-slate-950 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Starred Watchlist</h3>
                  <span className="bg-amber-400 text-slate-950 text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs">
                    {watchlistProperties.length} {watchlistProperties.length === 1 ? 'Unit Saved' : 'Units Saved'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Pinned priority properties for instant 3D inspection, EMI calculation, and PayPal reservation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenFavoritesModal && (
                <button
                  type="button"
                  onClick={onOpenFavoritesModal}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FolderSync className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Sync to Cloud Favorites</span>
                  <span className="sm:hidden">Sync</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setFilterType('Watchlist')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-xs transition-colors cursor-pointer"
              >
                Focus Watchlist Grid
              </button>
              <button
                type="button"
                onClick={() => setShowWatchlistSection(!showWatchlistSection)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 text-amber-900 transition-colors cursor-pointer"
              >
                {showWatchlistSection ? 'Collapse Shelf' : 'Expand Shelf'}
              </button>
            </div>
          </div>

          {showWatchlistSection && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchlistProperties.map((prop) => {
                const isItemFavorited = favoritePropertyIds.includes(prop.id);
                return (
                <div
                  key={`watchlist-item-${prop.id}`}
                  className="bg-white border border-amber-200/80 rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="relative aspect-16/10 rounded-lg overflow-hidden bg-slate-100">
                      <img
                        src={prop.image}
                        alt={prop.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="400" height="250" fill="%231e293b"/><text x="50%" y="50%" fill="%2394a3b8" font-size="16" text-anchor="middle" dominant-baseline="middle">Watchlist Unit</text></svg>';
                        }}
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-white bg-slate-950/80 backdrop-blur-xs px-2 py-0.5 rounded">
                          {prop.id}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded text-white ${
                            prop.type === 'Rent' ? 'bg-blue-600' : 'bg-emerald-600'
                          }`}
                        >
                          {prop.type === 'Rent' ? 'Rent' : 'Sale'}
                        </span>
                      </div>

                      {/* Cloud Favorite & Watchlist Buttons */}
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite?.(prop);
                          }}
                          title={isItemFavorited ? 'Remove from Cloud Favorites' : 'Save to Cloud Favorites (Firestore)'}
                          className={`p-1.5 rounded-lg shadow-md transition-colors cursor-pointer ${
                            isItemFavorited
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-950/70 hover:bg-slate-950/90 text-white hover:text-rose-300'
                          }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              isItemFavorited ? 'fill-white text-white' : 'text-current'
                            }`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWatchlist?.(prop.id);
                          }}
                          title="Remove from Watchlist"
                          className="p-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-lg shadow-md transition-colors cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                        </button>
                      </div>

                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent p-2 text-white flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-400" />
                          <span>{prop.location}</span>
                        </span>
                        <span className="text-amber-300 font-bold">🛡️ {prop.safetyScore || 9}/10</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{prop.title}</h4>
                      <div className="flex items-center justify-between mt-1 text-xs">
                        <div className="font-mono font-extrabold text-blue-900">
                          {prop.type === 'Rent'
                            ? `$${prop.rent?.toLocaleString()}/mo`
                            : `$${prop.price?.toLocaleString()}`}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {prop.bedrooms} · {prop.sqft} sqft
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-3 mt-3 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => handleDirectLock(prop)}
                      className="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold py-1.5 px-2 rounded-lg text-center transition-colors cursor-pointer text-[11px]"
                    >
                      {prop.type === 'Rent' ? 'Lock Deposit' : 'EMI Plan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(prop)}
                      title="View Photos & Full Details"
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectPropertyFor3D) onSelectPropertyFor3D(prop);
                        else onNavigateTab('3d');
                      }}
                      title="Inspect in 3D"
                      className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <Box className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectPropertyForMap) onSelectPropertyForMap(prop);
                        else onNavigateTab('map');
                      }}
                      title="View on Maps"
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleComparison(prop.id)}
                      title={comparisonIds.includes(prop.id) ? 'Remove from Comparison' : 'Add to Side-by-Side Comparison'}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        comparisonIds.includes(prop.id)
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </section>
      )}

      {/* Cloud Favorites Empty State when Favorites Filter is active */}
      {filterType === 'Favorites' && filteredProperties.length === 0 && (
        <div className="bg-white border-2 border-dashed border-rose-300 rounded-2xl p-12 text-center space-y-4 animate-in fade-in duration-200">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-500 shadow-inner">
            <Heart className="w-7 h-7 fill-rose-300 text-rose-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No Cloud Favorites Saved Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Properties saved to Cloud Favorites are stored persistently in Firestore under your user account across all devices and sessions. Click the heart ❤️ button on any property card to save it.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setFilterType('All')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>Browse All Properties</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {onOpenFavoritesModal && (
              <button
                type="button"
                onClick={onOpenFavoritesModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-500" />
                <span>Open Cloud Vault</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Watchlist Empty State when Watchlist Filter is active */}
      {filterType === 'Watchlist' && filteredProperties.length === 0 && (
        <div className="bg-white border-2 border-dashed border-amber-300 rounded-2xl p-12 text-center space-y-4 animate-in fade-in duration-200">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-500 shadow-inner">
            <Star className="w-7 h-7 fill-amber-300 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Your Watchlist is Empty</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              You haven't starred any properties yet. Click the ⭐ star button on any property card to save it here for quick comparison and escrow reservations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFilterType('All')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <span>Browse All Properties</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Property Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((prop) => {
          const isReserved = prop.status !== 'Available';
          const isStarred = watchlistIds.includes(prop.id);
          const isCompared = comparisonIds.includes(prop.id);
          const isFavorited = favoritePropertyIds.includes(prop.id);

          return (
            <div
              key={prop.id}
              className={`group bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col ${
                isStarred
                  ? 'border-amber-300 ring-1 ring-amber-300/60'
                  : isCompared
                  ? 'border-blue-400 ring-1 ring-blue-400/50'
                  : 'border-slate-200'
              }`}
            >
              {/* Image Container with Carousel & Badges */}
              <div className="relative overflow-hidden bg-slate-950 group/carousel">
                {/* Photo Gallery Carousel */}
                <PropertyGalleryCarousel
                  property={prop}
                  mode="card"
                  onImageClick={() => handleOpenDetails(prop)}
                />

                {/* Status & Safety Overlays */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-20 pointer-events-none">
                  <div className="flex items-center gap-1.5 pointer-events-auto">
                    <span className="font-mono text-xs font-bold text-white bg-slate-950/80 backdrop-blur-xs px-2.5 py-1 rounded-md">
                      {prop.id}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md backdrop-blur-xs ${
                        prop.type === 'Rent'
                          ? 'bg-blue-600/90 text-white'
                          : 'bg-emerald-600/90 text-white'
                      }`}
                    >
                      {prop.type === 'Rent' ? 'For Lease' : 'For Purchase'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pointer-events-auto">
                    {/* Compare Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComparison(prop.id);
                      }}
                      title={isCompared ? 'Remove from Side-by-Side Comparison' : 'Add to Side-by-Side Comparison (Max 3)'}
                      className={`px-2.5 py-1 rounded-lg backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
                        isCompared
                          ? 'bg-blue-600 text-white font-bold border border-blue-400 ring-2 ring-blue-500/40'
                          : 'bg-slate-950/70 hover:bg-slate-950/90 text-white hover:text-blue-300 border border-white/20'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5 text-current" />
                      <span className="text-[11px] font-semibold">
                        {isCompared ? 'Compared' : 'Compare'}
                      </span>
                    </button>

                    {/* Star to Watchlist Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist?.(prop.id);
                      }}
                      title={isStarred ? 'Remove from Watchlist' : 'Add to Starred Watchlist'}
                      className={`px-2.5 py-1 rounded-lg backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
                        isStarred
                          ? 'bg-amber-400 text-slate-950 font-bold border border-amber-300 ring-2 ring-amber-400/40'
                          : 'bg-slate-950/70 hover:bg-slate-950/90 text-white hover:text-amber-300 border border-white/20'
                      }`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          isStarred ? 'fill-slate-950 text-slate-950' : 'text-current'
                        }`}
                      />
                      <span className="text-[11px] font-semibold">
                        {isStarred ? 'Saved' : 'Watchlist'}
                      </span>
                    </button>

                    {/* Cloud Favorite Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite?.(prop);
                      }}
                      title={isFavorited ? 'Remove from Cloud Favorites (Firestore)' : 'Save to Cloud Favorites (Firestore)'}
                      className={`px-2.5 py-1 rounded-lg backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
                        isFavorited
                          ? 'bg-rose-600 text-white font-bold border border-rose-400 ring-2 ring-rose-500/40'
                          : 'bg-slate-950/70 hover:bg-slate-950/90 text-white hover:text-rose-300 border border-white/20'
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isFavorited ? 'fill-white text-white' : 'text-current'
                        }`}
                      />
                      <span className="text-[11px] font-semibold">
                        {isFavorited ? 'Favorited' : 'Favorite'}
                      </span>
                    </button>

                    {prop.safetyScore && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs bg-slate-950/85 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-xs">
                        <span className="text-emerald-400">🛡️</span>
                        <span>{prop.safetyScore}/10</span>
                      </span>
                    )}
                  </div>
                </div>

                {isReserved && (
                  <div className="absolute inset-0 z-30 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 pointer-events-none">
                    <div className="bg-white/95 rounded-xl p-3 text-center shadow-lg pointer-events-auto">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                      <div className="text-xs font-bold text-slate-900 mt-1">{prop.status}</div>
                      <div className="text-[10px] text-slate-500">PayPal Escrow Locked</div>
                    </div>
                  </div>
                )}

                {/* Location Bar at bottom of photo */}
                <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-3 pt-6 text-white flex items-center justify-between text-xs pointer-events-none">
                  <div className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{prop.location}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetails(prop);
                    }}
                    className="pointer-events-auto text-[11px] font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-md px-2 py-0.5 rounded text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View Gallery</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3
                    onClick={() => handleOpenDetails(prop)}
                    className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors cursor-pointer"
                  >
                    {prop.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{prop.description}</p>

                  {/* Property Specs */}
                  <div className="flex items-center gap-4 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prop.bedrooms}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bath className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prop.bathrooms} Baths</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{prop.sqft} sq ft</span>
                    </div>
                  </div>

                  {/* Investment & Safety Metric Badges */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-[11px]">
                    <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-lg px-2.5 py-1.5 text-emerald-900 flex items-center justify-between">
                      <span className="text-emerald-700 font-medium">🛡️ Safety / Walk</span>
                      <span className="font-bold">
                        {prop.safetyScore || 9}/10 · {prop.walkScore || 90}
                      </span>
                    </div>
                    <div className="bg-blue-50/70 border border-blue-200/60 rounded-lg px-2.5 py-1.5 text-blue-900 flex items-center justify-between">
                      <span className="text-blue-700 font-medium">📈 Yield / 5-Yr</span>
                      <span className="font-bold font-mono">
                        {prop.rentalYield || 8.2}% · {prop.fiveYearAppreciation || '+24%'}
                      </span>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    {prop.type === 'Rent' ? (
                      <>
                        <div>
                          <div className="text-[11px] uppercase font-bold text-slate-400">Monthly Rent</div>
                          <div className="font-mono text-lg font-bold text-slate-900">
                            ${prop.rent?.toLocaleString()}
                            <span className="text-xs font-normal text-slate-500">/mo</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] uppercase font-bold text-slate-400">Token Deposit</div>
                          <div className="font-mono text-sm font-semibold text-blue-700">
                            ${prop.deposit} USD
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="text-[11px] uppercase font-bold text-slate-400">Purchase Price</div>
                          <div className="font-mono text-lg font-bold text-slate-900">
                            ${prop.price?.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] uppercase font-bold text-slate-400">Min Downpayment</div>
                          <div className="font-mono text-sm font-semibold text-emerald-700">
                            ${prop.minDownpayment?.toLocaleString()}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <div className="flex gap-2">
                    {prop.type === 'Rent' ? (
                      <button
                        type="button"
                        onClick={() => handleDirectLock(prop)}
                        disabled={isReserved}
                        className="flex-1 bg-[#FFC439] hover:bg-[#F2BA36] disabled:bg-slate-200 text-[#003087] font-bold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                      >
                        <span className="italic font-serif">
                          Pay<span className="text-[#0079C1]">Pal</span>
                        </span>
                        <span>Lock Deposit (${prop.deposit})</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPropertyForEmi(prop);
                          onNavigateTab('emi');
                        }}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Calculator className="w-3.5 h-3.5 text-amber-400" />
                        <span>Calculate EMI Plan</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenDetails(prop)}
                      title="View Full Photos & Specifications"
                      className="p-2.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-900 rounded-xl transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-slate-700" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectPropertyFor3D) {
                          onSelectPropertyFor3D(prop);
                        } else {
                          onNavigateTab('3d');
                        }
                      }}
                      title="Launch Three.js 3D Virtual Tour"
                      className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl transition-colors cursor-pointer"
                    >
                      <Box className="w-4 h-4 text-indigo-700" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectPropertyForMap) {
                          onSelectPropertyForMap(prop);
                        } else {
                          onNavigateTab('map');
                        }
                      }}
                      title="View on Google Maps"
                      className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl transition-colors cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-emerald-700" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectPropertyForAgreement(prop);
                        onNavigateTab('agreements');
                      }}
                      title="View Digital Agreement Draft"
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setChartLocation(prop.location);
                        setShowTrends(true);
                        document.getElementById('market-trends-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      title={`View ${prop.location} D3.js Market Trends`}
                      className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl transition-colors cursor-pointer"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAskBrokerAboutProperty(prop)}
                    className="w-full text-center text-xs text-blue-800 hover:text-blue-950 font-medium py-1 transition-colors cursor-pointer"
                  >
                    Ask EstateMind AI about this listing →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Comparison Dock */}
      {comparisonIds.length > 0 && !isComparisonOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 text-white rounded-2xl shadow-2xl p-2.5 sm:px-4 sm:py-3 flex items-center gap-3 sm:gap-4 max-w-xl w-[94vw] sm:w-auto">
            {/* Left Info & Selected Thumbnails */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400">
                <Scale className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Compare Matrix</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-600 text-white rounded-full font-bold">
                    {comparisonIds.length}/3
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {3 - comparisonIds.length > 0
                    ? `Can add ${3 - comparisonIds.length} more`
                    : 'Max 3 selected'}
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex -space-x-2 overflow-hidden">
                {comparedProperties.map((cp) => (
                  <div
                    key={cp.id}
                    className="relative group/thumb cursor-pointer"
                    onClick={() => handleToggleComparison(cp.id)}
                    title={`Click to remove ${cp.id}`}
                  >
                    <img
                      src={cp.image}
                      alt={cp.title}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-slate-950 hover:opacity-75 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setComparisonIds([])}
                className="text-[11px] text-slate-400 hover:text-white px-2 py-1.5 transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsComparisonOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer hover:shadow-blue-500/25"
              >
                <span>Compare Side-by-Side</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Limit Notice Toast */}
      {comparisonNotice && (
        <div className="fixed bottom-22 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl border border-amber-300 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>⚠️</span>
          <span>{comparisonNotice}</span>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      <PropertyComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        comparedProperties={comparedProperties}
        allProperties={properties}
        onAddProperty={handleToggleComparison}
        onRemoveProperty={handleToggleComparison}
        onClearComparison={() => setComparisonIds([])}
        onTriggerPayPal={onTriggerPayPal}
        onSelectPropertyForEmi={onSelectPropertyForEmi}
        onSelectPropertyFor3D={onSelectPropertyFor3D}
        onSelectPropertyForMap={onSelectPropertyForMap}
        onAskBrokerAboutProperty={onAskBrokerAboutProperty}
        onSelectPropertyForAgreement={onSelectPropertyForAgreement}
      />

      {/* Dedicated Property Detail & Photo Gallery Modal */}
      <PropertyDetailModal
        property={selectedDetailProperty}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        isStarred={
          selectedDetailProperty ? watchlistIds.includes(selectedDetailProperty.id) : false
        }
        isCompared={
          selectedDetailProperty ? comparisonIds.includes(selectedDetailProperty.id) : false
        }
        isFavorited={
          selectedDetailProperty
            ? userFavorites.some((f) => f.propertyId === selectedDetailProperty.id)
            : false
        }
        onToggleWatchlist={onToggleWatchlist}
        onToggleComparison={handleToggleComparison}
        onToggleFavorite={onToggleFavorite}
        onTriggerPayPal={onTriggerPayPal}
        onSelectPropertyForEmi={onSelectPropertyForEmi}
        onSelectPropertyFor3D={onSelectPropertyFor3D}
        onSelectPropertyForMap={onSelectPropertyForMap}
        onAskBrokerAboutProperty={onAskBrokerAboutProperty}
        onSelectPropertyForAgreement={onSelectPropertyForAgreement}
      />
    </div>
  );
};
