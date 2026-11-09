import React, { useState } from 'react';
import { Property, AuthUser, UserFavoriteItem, PayPalTransaction } from '../types';
import {
  Heart,
  X,
  ExternalLink,
  Box,
  MapPin,
  Trash2,
  FileSpreadsheet,
  Download,
  Check,
  Edit3,
  Save,
  CloudCheck,
  Cloud,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building2,
  FolderSync,
} from 'lucide-react';

interface FavoritesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: UserFavoriteItem[];
  allProperties: Property[];
  watchlistIds: string[];
  currentUser: AuthUser | null;
  onRemoveFavorite: (propertyId: string) => Promise<void>;
  onUpdateNotes: (propertyId: string, notes: string) => Promise<void>;
  onImportWatchlist: () => Promise<void>;
  onSelectPropertyFor3D: (property: Property) => void;
  onSelectPropertyForMap: (property: Property) => void;
  onTriggerPayPal: (tx: PayPalTransaction) => void;
  onOpenDetails: (property: Property) => void;
}

export const FavoritesManagerModal: React.FC<FavoritesManagerModalProps> = ({
  isOpen,
  onClose,
  favorites,
  allProperties,
  watchlistIds,
  currentUser,
  onRemoveFavorite,
  onUpdateNotes,
  onImportWatchlist,
  onSelectPropertyFor3D,
  onSelectPropertyForMap,
  onTriggerPayPal,
  onOpenDetails,
}) => {
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>('');
  const [noteSaveStatus, setNoteSaveStatus] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Rent' | 'Sale'>('All');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartEditNote = (fav: UserFavoriteItem) => {
    setEditingNotesId(fav.propertyId);
    setNoteDraft(fav.notes || '');
  };

  const handleSaveNote = async (propertyId: string) => {
    try {
      await onUpdateNotes(propertyId, noteDraft);
      setEditingNotesId(null);
      setNoteSaveStatus(propertyId);
      setTimeout(() => setNoteSaveStatus(null), 2500);
    } catch (err) {
      console.warn('Failed to save note:', err);
    }
  };

  const handleTriggerImport = async () => {
    setIsImporting(true);
    try {
      await onImportWatchlist();
      setImportMessage('Successfully synced session Watchlist into Cloud Favorites!');
      setTimeout(() => setImportMessage(null), 3500);
    } catch (err) {
      console.warn('Import error:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const favoritedPropertyIds = favorites.map((f) => f.propertyId);
  const unimportedWatchlistCount = watchlistIds.filter(
    (id) => !favoritedPropertyIds.includes(id)
  ).length;

  const filteredFavorites = favorites.filter((fav) => {
    const matchesType = typeFilter === 'All' || fav.propertyType === typeFilter;
    const matchesSearch =
      searchFilter === '' ||
      fav.propertyTitle.toLowerCase().includes(searchFilter.toLowerCase()) ||
      fav.location.toLowerCase().includes(searchFilter.toLowerCase()) ||
      fav.propertyId.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (fav.notes && fav.notes.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleExportFavoritesJson = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: currentUser?.email || 'authenticated-user',
      database: 'ai-studio-estatemindaireal-5ed457f0-df41-4c38-bd5a-9e4ae2f60d42',
      collection: 'user_favorites',
      count: favorites.length,
      items: favorites,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estatemind-cloud-favorites-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorites-vault-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 shadow-xs">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="favorites-vault-title" className="text-lg font-bold tracking-tight text-white">
                  Cloud User Favorites
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {favorites.length} Saved
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                <Cloud className="w-3.5 h-3.5 text-blue-400 inline" />
                <span>Persistent Firestore Collection:</span>
                <span className="font-mono text-[11px] text-amber-300">user_favorites</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportFavoritesJson}
              title="Export Cloud Favorites to JSON"
              disabled={favorites.length === 0}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Backup</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close favorites modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sync & User Info Banner */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium">Firestore Live Listener</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 truncate max-w-[280px]">
              {currentUser?.email ? `Account: ${currentUser.email}` : 'Preview Authenticated Guest'}
            </span>
          </div>

          {unimportedWatchlistCount > 0 && (
            <button
              onClick={handleTriggerImport}
              disabled={isImporting}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
            >
              <FolderSync className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {isImporting
                  ? 'Syncing...'
                  : `Sync ${unimportedWatchlistCount} Watchlist ${
                      unimportedWatchlistCount === 1 ? 'item' : 'items'
                    } to Cloud`}
              </span>
            </button>
          )}
        </div>

        {importMessage && (
          <div className="mx-4 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importMessage}</span>
          </div>
        )}

        {/* Controls Bar: Search & Filter */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search in favorites or private notes..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {(['All', 'Rent', 'Sale'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  typeFilter === type
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Favorites List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {filteredFavorites.length === 0 ? (
            <div className="py-12 px-4 text-center bg-white rounded-xl border border-dashed border-slate-300">
              <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mb-3">
                <Heart className="w-6 h-6 stroke-rose-400 fill-none" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {favorites.length === 0 ? 'No Cloud Favorites Saved Yet' : 'No matching favorites found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                {favorites.length === 0
                  ? 'Unlike the temporary session watchlist, properties saved here are permanently stored in Firestore under your account across devices and sessions.'
                  : 'Try adjusting your search query or switching the Rent/Sale filter.'}
              </p>
              {unimportedWatchlistCount > 0 && (
                <button
                  onClick={handleTriggerImport}
                  disabled={isImporting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
                >
                  <FolderSync className="w-4 h-4" />
                  <span>Import {unimportedWatchlistCount} items from current Watchlist</span>
                </button>
              )}
            </div>
          ) : (
            filteredFavorites.map((fav) => {
              const fullProperty = allProperties.find((p) => p.id === fav.propertyId);
              const isEditingNote = editingNotesId === fav.propertyId;
              const isNoteSaved = noteSaveStatus === fav.propertyId;

              return (
                <div
                  key={fav.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row gap-4 items-start"
                >
                  {/* Image & Basic Badge */}
                  <div className="w-full md:w-48 h-36 rounded-lg overflow-hidden relative shrink-0 bg-slate-100 border border-slate-200">
                    <img
                      src={fav.image}
                      alt={fav.propertyTitle}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-xs ${
                          fav.propertyType === 'Rent'
                            ? 'bg-blue-900 text-white'
                            : 'bg-emerald-700 text-white'
                        }`}
                      >
                        {fav.propertyType}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-black/60 text-white rounded-sm backdrop-blur-xs">
                        {fav.propertyCategory}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="text-xs font-extrabold text-white bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 rounded-sm">
                        {fav.priceDisplay}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 w-full min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                            {fav.propertyId}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Saved {new Date(fav.savedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 hover:text-blue-900 transition-colors mt-0.5">
                          {fav.propertyTitle}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{fav.location}</span>
                        </p>
                      </div>

                      {/* Remove Favorite Button */}
                      <button
                        onClick={() => onRemoveFavorite(fav.propertyId)}
                        title="Remove from Cloud Favorites"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Private Notes Section */}
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                          <Edit3 className="w-3 h-3 text-slate-500" />
                          <span>My Private Cloud Note</span>
                        </span>
                        {isNoteSaved && (
                          <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Note Saved to Firestore
                          </span>
                        )}
                      </div>

                      {isEditingNote ? (
                        <div className="space-y-2">
                          <textarea
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            placeholder="Add your personal notes (e.g., favorite features, moving date, commute time)..."
                            className="w-full text-xs p-2 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            rows={2}
                          />
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => setEditingNotesId(null)}
                              className="px-2 py-1 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveNote(fav.propertyId)}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-900 text-white text-xs font-semibold rounded-md hover:bg-blue-800 transition-colors cursor-pointer"
                            >
                              <Save className="w-3 h-3" />
                              <span>Save Note</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleStartEditNote(fav)}
                          className="group cursor-pointer py-1 px-1.5 rounded hover:bg-white text-xs transition-colors"
                        >
                          {fav.notes ? (
                            <p className="text-slate-700 italic text-[11px]">"{fav.notes}"</p>
                          ) : (
                            <p className="text-slate-400 italic text-[11px] group-hover:text-blue-700">
                              + Click to add private note for this property...
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      {fullProperty && (
                        <>
                          <button
                            onClick={() => {
                              onSelectPropertyFor3D(fullProperty);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Box className="w-3.5 h-3.5" />
                            <span>3D Tour</span>
                          </button>

                          <button
                            onClick={() => {
                              onSelectPropertyForMap(fullProperty);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5 text-red-500" />
                            <span>Maps</span>
                          </button>

                          <button
                            onClick={() => {
                              const depositAmt = fullProperty.deposit || (fullProperty.rent ? fullProperty.rent * 0.2 : 500);
                              onTriggerPayPal({
                                action: 'INITIATE_PAYPAL_PAYMENT',
                                payment_category: 'RENTAL_DEPOSIT',
                                property_id: fullProperty.id,
                                property_title: fullProperty.title,
                                amount: depositAmt,
                                currency: 'USD',
                              });
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Lock via PayPal</span>
                          </button>

                          <button
                            onClick={() => {
                              onOpenDetails(fullProperty);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md transition-colors ml-auto cursor-pointer"
                          >
                            <span>Details</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Encrypted & persisted to Cloud Firestore rules under your authenticated UID.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
