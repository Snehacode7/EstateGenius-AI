import { PersonaType, AuthUser } from '../types';
import { Building2, UserCircle, Briefcase, History, Box, MapPin, LogIn, LogOut, Star, Heart } from 'lucide-react';

interface TopBarProps {
  activeTab: 'chat' | 'properties' | '3d' | 'map' | 'emi' | 'agreements' | 'owner';
  setActiveTab: (tab: 'chat' | 'properties' | '3d' | 'map' | 'emi' | 'agreements' | 'owner') => void;
  activePersona: PersonaType;
  setActivePersona: (persona: PersonaType) => void;
  completedTransactionsCount: number;
  watchlistCount?: number;
  favoritesCount?: number;
  onOpenHistory: () => void;
  onOpenFavorites?: () => void;
  currentUser: AuthUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  activePersona,
  setActivePersona,
  completedTransactionsCount,
  watchlistCount = 0,
  favoritesCount = 0,
  onOpenHistory,
  onOpenFavorites,
  currentUser,
  onSignIn,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setActiveTab('chat')}
          className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-blue-900 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <span className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-serif text-sm shadow-xs">
            EM
          </span>
          <span className="hidden sm:inline">EstateMind AI</span>
          <span className="sm:hidden">EstateMind</span>
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('chat')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
              activeTab === 'chat'
                ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                : 'hover:text-slate-900'
            }`}
          >
            Broker AI
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'properties'
                ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                : 'hover:text-slate-900'
            }`}
          >
            <span>Properties</span>
            {watchlistCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full border border-amber-300">
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                <span>{watchlistCount}</span>
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('3d')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer flex items-center gap-1 ${
              activeTab === '3d'
                ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                : 'hover:text-slate-900'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-blue-600" />
            <span>3D Tour</span>
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer flex items-center gap-1 ${
              activeTab === 'map'
                ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                : 'hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            <span>Maps</span>
          </button>
          <button
            onClick={() => setActiveTab('emi')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
              activeTab === 'emi'
                ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                : 'hover:text-slate-900'
            }`}
          >
            EMI Studio
          </button>
          <button
            onClick={() => setActiveTab('agreements')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
              activeTab === 'agreements'
                ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                : 'hover:text-slate-900'
            }`}
          >
            Agreements
          </button>
          <button
            onClick={() => setActiveTab('owner')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
              activeTab === 'owner'
                ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                : 'hover:text-slate-900'
            }`}
          >
            Owner Portal
          </button>
        </nav>

        {/* Zone 3: Actions, Persona Switcher & Auth */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Cloud Favorites Vault */}
          <button
            onClick={onOpenFavorites}
            title="Open Cloud User Favorites Vault (Firestore)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span className="hidden sm:inline">Favorites</span>
            {favoritesCount > 0 && (
              <span className="text-[10px] font-bold bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded-full">
                {favoritesCount}
              </span>
            )}
          </button>

          {completedTransactionsCount > 0 && (
            <button
              onClick={onOpenHistory}
              title="View PayPal Escrow Transactions"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-blue-700" />
              <span>{completedTransactionsCount} Paid</span>
            </button>
          )}

          {/* Persona Switcher Toggle */}
          <button
            onClick={() =>
              setActivePersona(activePersona === 'client' ? 'owner' : 'client')
            }
            className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-3.5 md:py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            {activePersona === 'client' ? (
              <>
                <UserCircle className="w-4 h-4 text-blue-600" />
                <span className="whitespace-nowrap hidden sm:inline">Role: Client / Buyer</span>
                <span className="whitespace-nowrap sm:hidden">Client</span>
                <span className="text-[10px] text-slate-400 font-normal">Switch</span>
              </>
            ) : (
              <>
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span className="whitespace-nowrap hidden sm:inline">Role: Owner / Landlord</span>
                <span className="whitespace-nowrap sm:hidden">Owner</span>
                <span className="text-[10px] text-slate-400 font-normal">Switch</span>
              </>
            )}
          </button>

          {/* Firebase Authentication Status */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
              <div
                title={currentUser.email || currentUser.displayName || 'Authenticated User'}
                className="w-8 h-8 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center overflow-hidden border border-slate-300"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}</span>
                )}
              </div>
              <button
                onClick={onSignOut}
                title="Sign out from Firebase Auth"
                className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              title="Sign in with Firebase Auth"
              className="flex items-center gap-1.5 px-3 py-1.5 md:py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-300" />
              <span className="whitespace-nowrap">Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile sub-navigation bar */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-2 bg-slate-50 border-t border-slate-200 overflow-x-auto text-xs font-medium no-scrollbar">
        <button
          onClick={() => setActiveTab('chat')}
          className={`whitespace-nowrap px-2.5 py-1 rounded-md ${activeTab === 'chat' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}
        >
          Broker AI
        </button>
        <button
          onClick={() => setActiveTab('properties')}
          className={`whitespace-nowrap px-2.5 py-1 rounded-md flex items-center gap-1.5 ${activeTab === 'properties' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}
        >
          <span>Properties</span>
          {watchlistCount > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full">
              ★ {watchlistCount}
            </span>
          )}
        </button>
        {onOpenFavorites && (
          <button
            onClick={onOpenFavorites}
            className="whitespace-nowrap px-2.5 py-1 rounded-md flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200"
          >
            <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
            <span>Favorites</span>
            {favoritesCount > 0 && (
              <span className="text-[9px] font-bold bg-rose-200 text-rose-900 px-1 rounded-full">
                {favoritesCount}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab('3d')}
          className={`whitespace-nowrap px-2.5 py-1 rounded-md flex items-center gap-1 ${activeTab === '3d' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}
        >
          <Box className="w-3 h-3" />
          <span>3D Tour</span>
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`whitespace-nowrap px-2.5 py-1 rounded-md flex items-center gap-1 ${activeTab === 'map' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}
        >
          <MapPin className="w-3 h-3" />
          <span>Maps</span>
        </button>
        <button
          onClick={() => setActiveTab('emi')}
          className={`whitespace-nowrap px-2.5 py-1 rounded-md ${activeTab === 'emi' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}
        >
          EMI Studio
        </button>
        <button
          onClick={() => setActiveTab('agreements')}
          className={`whitespace-nowrap px-2.5 py-1 rounded-md ${activeTab === 'agreements' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}
        >
          Agreements
        </button>
        <button
          onClick={() => setActiveTab('owner')}
          className={`whitespace-nowrap px-2.5 py-1 rounded-md ${activeTab === 'owner' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}
        >
          Owner
        </button>
      </div>
    </header>
  );
};
