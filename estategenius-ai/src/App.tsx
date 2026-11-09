import React, { useState, useEffect } from 'react';
import {
  PersonaType,
  Property,
  PayPalTransaction,
  ChatMessage,
  CompletedTransaction,
  ThreeDAction,
  MapFocusAction,
  AuthUser,
  MaintenanceTicket,
  UserFavoriteItem,
} from './types';
import { INITIAL_PROPERTIES } from './data/mockProperties';
import { TopBar } from './components/TopBar';
import { ChatBroker } from './components/ChatBroker';
import { PropertyShowcase } from './components/PropertyShowcase';
import { PropertyViewer3D } from './components/PropertyViewer3D';
import { PropertyMap } from './components/PropertyMap';
import { EmiStudio } from './components/EmiStudio';
import { AgreementViewer } from './components/AgreementViewer';
import { OwnerPortal } from './components/OwnerPortal';
import { PayPalModal } from './components/PayPalModal';
import { TransactionHistoryModal } from './components/TransactionHistoryModal';
import { FavoritesManagerModal } from './components/FavoritesManagerModal';
import { extractActionsFromText } from './utils/paymentParser';
import { auth, db, googleAuthProvider } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, signInAnonymously, signOut } from 'firebase/auth';
import { doc, setDoc, collection } from 'firebase/firestore';
import {
  subscribeToMaintenanceTickets,
  createMaintenanceTicketInFirestore,
  updateMaintenanceTicketStatusInFirestore,
  INITIAL_TICKETS,
} from './services/maintenanceService';
import {
  getLocalWatchlist,
  toggleWatchlistProperty,
  subscribeToUserWatchlist,
} from './services/watchlistService';
import {
  saveUserFavorite,
  removeUserFavorite,
  updateFavoriteNotes,
  subscribeToUserFavorites,
  importWatchlistToFavorites,
  getLocalFavorites,
} from './services/favoritesService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'properties' | '3d' | 'map' | 'emi' | 'agreements' | 'owner'>('chat');
  const [activePersona, setActivePersona] = useState<PersonaType>('client');
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(INITIAL_PROPERTIES[0]);

  // Auth User state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // User Cloud Favorites state (Firestore Persisted)
  const [userFavorites, setUserFavorites] = useState<UserFavoriteItem[]>(() => getLocalFavorites());
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState<boolean>(false);

  // 3D & Map Action targets triggered from Chat or Property cards
  const [target3DAction, setTarget3DAction] = useState<ThreeDAction | null>(null);
  const [targetMapAction, setTargetMapAction] = useState<MapFocusAction | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL,
        });
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      console.warn('Sign in with popup cancelled or unavailable:', err?.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
    setCurrentUser(null);
  };

  // Initial welcome message with warm emoji style
  const initialGreeting = `👋 **Hello & Welcome to EstateMind AI!**\n\nI'm your warm, friendly real estate broker assistant. Here is a glance at our featured properties:\n\n- 🏠 **Downtown Luxury 2-BHK (PROP-101)**: $1,200/mo rent · $200 Token Deposit · Downtown (3D Virtual Tour & Maps ready)\n- 🏡 **Modern Suburban Villa (PROP-102)**: $120,000 price · $20,000 Downpayment · Heights (5-Year EMI plan available)\n- 🏢 **Commercial Studio Space (PROP-103)**: $850/mo rent · $150 Token Deposit · Tech Park (Fast transit)\n\n*Would you like to step inside with a 3D tour, check out the neighborhood on Google Maps, or calculate an EMI plan?*`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'assistant',
      content: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      id: 'msg-ticket-init',
      sender: 'assistant',
      content: `🔧 **MAINTENANCE TICKET CREATED & STORED IN FIRESTORE**\n\nTicket **#TICK-PROP101-PLUMB-75** has been logged in Cloud Firestore (\`ai-studio-estatemindaireal-5ed457f0-df41-4c38-bd5a-9e4ae2f60d42\`):\n\n- 🏠 **Property**: **Downtown Luxury 2-BHK (PROP-101)**\n- 🛠️ **Category**: **PLUMBING**\n- 🚨 **Urgency**: **HIGH**\n- 💰 **Estimated Repair Cost**: **$75.00 USD**\n- 📋 **Status**: **OPEN**\n\n*The ticket is now live in the **Owner & Landlord Operations** tab for contractor dispatch and status tracking.*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      detectedMaintenance: {
        action: 'LOG_MAINTENANCE_TICKET',
        ticket_id: 'TICK-PROP101-PLUMB-75',
        property_id: 'PROP-101',
        property_title: 'Downtown Luxury 2-BHK',
        issue_type: 'Plumbing Pipe Leak',
        severity: 'High',
        estimated_cost: '75.00',
        status: 'OPEN',
      },
    },
  ]);

  // Maintenance Tickets Firestore Sync State
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>(INITIAL_TICKETS);

  useEffect(() => {
    // Ensure the requested maintenance ticket is saved into Firestore
    const requestedTicket: MaintenanceTicket = {
      id: 'TICK-PROP101-PLUMB-75',
      propertyId: 'PROP-101',
      propertyTitle: 'Downtown Luxury 2-BHK',
      issueCategory: 'PLUMBING',
      issue: 'Urgent High-Severity Plumbing Pipe Leak Repair',
      urgency: 'HIGH',
      severity: 'High',
      estimatedCostUsd: 75.00,
      status: 'OPEN',
      reportedDate: 'Today, 08:44 AM',
      reportedBy: 'snehu5125@gmail.com',
      createdAt: new Date().toISOString(),
    };

    createMaintenanceTicketInFirestore(requestedTicket).catch((err) => {
      console.warn('Firestore initial ticket write note:', err);
    });

    // Real-time Firestore sync listener
    const unsubscribe = subscribeToMaintenanceTickets((tickets) => {
      setMaintenanceTickets(tickets);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleTicketStatus = async (
    ticketId: string,
    currentStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  ) => {
    const nextStatus = currentStatus === 'OPEN' ? 'IN_PROGRESS' : currentStatus === 'IN_PROGRESS' ? 'RESOLVED' : 'OPEN';
    setMaintenanceTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: nextStatus } : t))
    );
    try {
      await updateMaintenanceTicketStatusInFirestore(ticketId, nextStatus);
    } catch (err) {
      console.warn('Error updating ticket in Firestore:', err);
    }
  };

  const handleCreateMaintenanceTicket = async (ticket: MaintenanceTicket) => {
    setMaintenanceTickets((prev) => [ticket, ...prev]);
    try {
      await createMaintenanceTicketInFirestore(ticket);
    } catch (err) {
      console.warn('Error creating ticket in Firestore:', err);
    }
  };

  // Watchlist State (Local & Firestore Synced)
  const [watchlistIds, setWatchlistIds] = useState<string[]>(() => {
    const local = getLocalWatchlist();
    return local.length > 0 ? local : ['PROP-101'];
  });

  useEffect(() => {
    if (!currentUser?.uid || !auth.currentUser) {
      setWatchlistIds(getLocalWatchlist());
      return;
    }
    const unsubscribe = subscribeToUserWatchlist(currentUser.uid, (ids) => {
      if (ids && ids.length > 0) {
        setWatchlistIds(ids);
      }
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleToggleWatchlist = async (propertyId: string) => {
    const isCurrentlySaved = watchlistIds.includes(propertyId);
    const nextState = !isCurrentlySaved;

    // Immediate optimistic update
    setWatchlistIds((prev) =>
      nextState ? (prev.includes(propertyId) ? prev : [...prev, propertyId]) : prev.filter((id) => id !== propertyId)
    );

    try {
      const updated = await toggleWatchlistProperty(currentUser?.uid, propertyId, nextState);
      setWatchlistIds(updated);
    } catch (err) {
      console.warn('Watchlist toggle note:', err);
    }
  };

  // Real-time Firestore Subscription for User Cloud Favorites
  useEffect(() => {
    const uid = currentUser?.uid;
    if (!uid || !auth.currentUser) {
      setUserFavorites(getLocalFavorites());
      return;
    }
    const unsubscribe = subscribeToUserFavorites(
      uid,
      (items) => {
        setUserFavorites(items);
      },
      (err) => {
        console.warn('Real-time favorites sync note:', err);
      }
    );
    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleToggleFavorite = async (property: Property) => {
    const effectiveUid = currentUser?.uid || auth.currentUser?.uid || 'user-guest-preview';
    const effectiveEmail = currentUser?.email || auth.currentUser?.email || 'alexander.wright@estatemind.ai';
    const effectiveName = currentUser?.displayName || auth.currentUser?.displayName || 'Alexander Wright';

    const effectiveUser: AuthUser = {
      uid: effectiveUid,
      email: effectiveEmail,
      displayName: effectiveName,
    };

    const isAlreadyFavorited = userFavorites.some((f) => f.propertyId === property.id);

    if (isAlreadyFavorited) {
      setUserFavorites((prev) => prev.filter((f) => f.propertyId !== property.id));
      try {
        await removeUserFavorite(effectiveUser.uid, property.id);
      } catch (err) {
        console.warn('Remove favorite note:', err);
      }
    } else {
      const priceDisplay =
        property.type === 'Rent'
          ? `$${property.rent?.toLocaleString() || '0'}/mo`
          : `$${property.price?.toLocaleString() || '0'}`;

      const tempFavorite: UserFavoriteItem = {
        id: `${effectiveUser.uid}_${property.id}`,
        userId: effectiveUser.uid,
        userEmail: effectiveUser.email || 'alexander.wright@estatemind.ai',
        propertyId: property.id,
        propertyTitle: property.title,
        propertyType: property.type,
        propertyCategory: property.category,
        location: property.location,
        priceDisplay,
        image: property.image,
        notes: '',
        savedAt: new Date().toISOString(),
      };
      setUserFavorites((prev) => [tempFavorite, ...prev]);

      try {
        await saveUserFavorite(effectiveUser, property);
      } catch (err) {
        console.warn('Save favorite note:', err);
      }
    }
  };

  const handleUpdateFavoriteNotes = async (propertyId: string, notes: string) => {
    const effectiveUid = currentUser?.uid || auth.currentUser?.uid || 'user-guest-preview';
    setUserFavorites((prev) =>
      prev.map((f) => (f.propertyId === propertyId ? { ...f, notes, updatedAt: new Date().toISOString() } : f))
    );
    try {
      await updateFavoriteNotes(effectiveUid, propertyId, notes);
    } catch (err) {
      console.warn('Update note note:', err);
    }
  };

  const handleImportWatchlistToFavorites = async () => {
    const effectiveUid = currentUser?.uid || auth.currentUser?.uid || 'user-guest-preview';
    const effectiveEmail = currentUser?.email || auth.currentUser?.email || 'alexander.wright@estatemind.ai';
    const effectiveName = currentUser?.displayName || auth.currentUser?.displayName || 'Alexander Wright';

    const effectiveUser: AuthUser = {
      uid: effectiveUid,
      email: effectiveEmail,
      displayName: effectiveName,
    };

    await importWatchlistToFavorites(effectiveUser, properties, watchlistIds);
  };

  // PayPal Payment Modal State
  const [activePayPalTx, setActivePayPalTx] = useState<PayPalTransaction | null>(null);
  const [isPayPalOpen, setIsPayPalOpen] = useState(false);

  // Completed Transactions Ledger
  const [completedTransactions, setCompletedTransactions] = useState<CompletedTransaction[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Open PayPal Modal
  const handleTriggerPayPal = (tx: PayPalTransaction) => {
    setActivePayPalTx(tx);
    setIsPayPalOpen(true);
  };

  // 3D Scene trigger
  const handleTrigger3D = (action: ThreeDAction) => {
    setTarget3DAction(action);
    const targetId = action.property_id || action.model_id;
    const matched = properties.find((p) => p.id === targetId);
    if (matched) {
      setSelectedProperty(matched);
    }
    setActiveTab('3d');
  };

  // Google Maps location trigger
  const handleTriggerMap = (action: MapFocusAction) => {
    setTargetMapAction(action);
    const matched = properties.find((p) => p.id === action.property_id);
    if (matched) {
      setSelectedProperty(matched);
    }
    setActiveTab('map');
  };

  // Payment Success Handler + Firestore Persistence
  const handlePaymentSuccess = async (completed: CompletedTransaction) => {
    setCompletedTransactions((prev) => [completed, ...prev]);

    // Update Property Status
    setProperties((prev) =>
      prev.map((prop) => {
        if (prop.id === completed.propertyId) {
          return {
            ...prop,
            status:
              completed.category === 'EMI_INSTALLMENT'
                ? 'EMI Plan Active'
                : 'Deposit Paid / Reserved',
          };
        }
        return prop;
      })
    );

    // Persist booking into Firebase Firestore
    try {
      const bookingRef = doc(collection(db, 'bookings'), completed.transactionId);
      await setDoc(bookingRef, {
        ...completed,
        userId: currentUser?.uid || 'anonymous-user',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Firestore booking persistence note:', error);
    }

    // Add confirmation message to AI chat
    const confirmMsg: ChatMessage = {
      id: `msg-confirm-${Date.now()}`,
      sender: 'assistant',
      content: `🎉 **PAYMENT CONFIRMED**: PayPal Escrow Transaction **${completed.transactionId}** has successfully cleared for **${completed.propertyTitle} (${completed.propertyId})**.\n\n- Amount Charged: **$${completed.amount.toLocaleString()} ${completed.currency}**\n- Payment Type: ${completed.category === 'RENTAL_DEPOSIT' ? 'Booking / Token Deposit' : 'EMI Installment Plan'}\n- Property Status: **Reserved / Locked** in broker escrow & logged in database.\n\nYou may view and print your legal receipt or counter-sign the digital lease agreement in the **Digital Agreements** tab.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, confirmMsg]);
  };

  // Add new property from Owner Portal
  const handleAddProperty = (newProp: Property) => {
    setProperties((prev) => [newProp, ...prev]);

    // Add notification in chat
    const notifyMsg: ChatMessage = {
      id: `msg-add-${Date.now()}`,
      sender: 'assistant',
      content: `📋 **NEW LISTING REGISTERED**: Property **${newProp.title} (${newProp.id})** has been added to our live broker database at **${newProp.type === 'Rent' ? `$${newProp.rent}/mo` : `$${newProp.price}`}** in **${newProp.location}**. Prospective clients can now search, inspect in 3D, and lock this unit directly.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, notifyMsg]);
  };

  // Ask Broker about specific property
  const handleAskBrokerAboutProperty = (prop: Property) => {
    setSelectedProperty(prop);
    setActiveTab('chat');
    const promptText =
      prop.type === 'Rent'
        ? `Tell me more about ${prop.title} (${prop.id}) in ${prop.location}. What are the lease covenants and can I lock it with the $${prop.deposit} deposit?`
        : `Break down the purchase financial structuring and EMI options for ${prop.title} (${prop.id}) listed at $${prop.price?.toLocaleString()}.`;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Send query to server
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, userMsg],
        activePersona,
        customProperties: properties,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const rawReply = data.reply || '';
        const {
          transaction,
          threeDAction,
          mapAction,
          contractAction,
          maintenanceAction,
          splitRentAction,
        } = extractActionsFromText(rawReply);
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-a`,
          sender: 'assistant',
          content: rawReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          detectedPayment: transaction,
          detected3DAction: threeDAction,
          detectedMapAction: mapAction,
          detectedContract: contractAction,
          detectedMaintenance: maintenanceAction,
          detectedSplitRent: splitRentAction,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      })
      .catch((err) => {
        console.error('Error querying broker about property:', err);
      });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activePersona={activePersona}
        setActivePersona={setActivePersona}
        completedTransactionsCount={completedTransactions.length}
        watchlistCount={watchlistIds.length}
        favoritesCount={userFavorites.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenFavorites={() => setIsFavoritesModalOpen(true)}
        currentUser={currentUser}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'chat' && (
          <ChatBroker
            messages={messages}
            setMessages={setMessages}
            activePersona={activePersona}
            properties={properties}
            onTriggerPayPal={handleTriggerPayPal}
            onTrigger3D={handleTrigger3D}
            onTriggerMap={handleTriggerMap}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'properties' && (
          <PropertyShowcase
            properties={properties}
            watchlistIds={watchlistIds}
            userFavorites={userFavorites}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleFavorite={handleToggleFavorite}
            onOpenFavoritesModal={() => setIsFavoritesModalOpen(true)}
            onTriggerPayPal={handleTriggerPayPal}
            onSelectPropertyForEmi={(prop) => {
              setSelectedProperty(prop);
              setActiveTab('emi');
            }}
            onSelectPropertyForAgreement={(prop) => {
              setSelectedProperty(prop);
              setActiveTab('agreements');
            }}
            onAskBrokerAboutProperty={handleAskBrokerAboutProperty}
            onSelectPropertyFor3D={(prop) => {
              setSelectedProperty(prop);
              setTarget3DAction({
                action: 'TRIGGER_3D_SCENE',
                target_room: 'Overview',
                animation_type: 'ZOOM_AND_ROTATE',
                model_id: prop.id,
              });
              setActiveTab('3d');
            }}
            onSelectPropertyForMap={(prop) => {
              setSelectedProperty(prop);
              setTargetMapAction({
                action: 'FOCUS_MAP_LOCATION',
                property_id: prop.id,
                location: prop.location,
                coordinates: prop.coordinates,
              });
              setActiveTab('map');
            }}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === '3d' && (
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <PropertyViewer3D
              property={selectedProperty || properties[0]}
              targetAction={target3DAction}
              onClose={() => setActiveTab('properties')}
            />
          </div>
        )}

        {activeTab === 'map' && (
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <PropertyMap
              properties={properties}
              selectedProperty={selectedProperty || properties[0]}
              onSelectProperty={setSelectedProperty}
              targetMapAction={targetMapAction}
              onLaunch3D={(prop) => {
                setSelectedProperty(prop);
                setTarget3DAction({
                  action: 'TRIGGER_3D_SCENE',
                  target_room: 'Overview',
                  animation_type: 'ZOOM_AND_ROTATE',
                  model_id: prop.id,
                });
                setActiveTab('3d');
              }}
              onLockDeposit={(prop) => {
                if (prop.type === 'Rent') {
                  handleTriggerPayPal({
                    action: 'INITIATE_PAYPAL_PAYMENT',
                    payment_category: 'RENTAL_DEPOSIT',
                    property_id: prop.id,
                    property_title: prop.title,
                    amount: prop.deposit || 200,
                    currency: 'USD',
                    details: `Token Deposit to lock ${prop.title} for 7 days`,
                  });
                } else {
                  setSelectedProperty(prop);
                  setActiveTab('emi');
                }
              }}
            />
          </div>
        )}

        {activeTab === 'emi' && (
          <EmiStudio
            properties={properties}
            selectedProperty={selectedProperty}
            onSelectProperty={setSelectedProperty}
            onTriggerPayPal={handleTriggerPayPal}
          />
        )}

        {activeTab === 'agreements' && (
          <AgreementViewer
            properties={properties}
            selectedProperty={selectedProperty}
            onSelectProperty={setSelectedProperty}
            onTriggerPayPal={handleTriggerPayPal}
          />
        )}

        {activeTab === 'owner' && (
          <OwnerPortal
            properties={properties}
            onAddProperty={handleAddProperty}
            onTriggerPayPal={handleTriggerPayPal}
            maintenanceTickets={maintenanceTickets}
            onToggleTicketStatus={handleToggleTicketStatus}
            onCreateTicket={handleCreateMaintenanceTicket}
          />
        )}
      </main>

      {/* PayPal Payment & Checkout Modal */}
      <PayPalModal
        isOpen={isPayPalOpen}
        transaction={activePayPalTx}
        onClose={() => setIsPayPalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Transaction History & Escrow Receipts Modal */}
      <TransactionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        transactions={completedTransactions}
      />

      {/* Cloud User Favorites Vault Modal (Firestore Persistent) */}
      <FavoritesManagerModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
        favorites={userFavorites}
        allProperties={properties}
        watchlistIds={watchlistIds}
        currentUser={currentUser}
        onRemoveFavorite={async (propId) => {
          const effectiveUid = currentUser?.uid || auth.currentUser?.uid || 'user-guest-preview';
          setUserFavorites((prev) => prev.filter((f) => f.propertyId !== propId));
          await removeUserFavorite(effectiveUid, propId);
        }}
        onUpdateNotes={handleUpdateFavoriteNotes}
        onImportWatchlist={handleImportWatchlistToFavorites}
        onSelectPropertyFor3D={(prop) => {
          setSelectedProperty(prop);
          setTarget3DAction({
            action: 'TRIGGER_3D_SCENE',
            target_room: 'Overview',
            animation_type: 'ZOOM_AND_ROTATE',
            model_id: prop.id,
          });
          setActiveTab('3d');
        }}
        onSelectPropertyForMap={(prop) => {
          setSelectedProperty(prop);
          setTargetMapAction({
            action: 'FOCUS_MAP_LOCATION',
            property_id: prop.id,
            location: prop.location,
            coordinates: prop.coordinates,
          });
          setActiveTab('map');
        }}
        onTriggerPayPal={handleTriggerPayPal}
        onOpenDetails={(prop) => {
          setSelectedProperty(prop);
          setActiveTab('properties');
        }}
      />
    </div>
  );
}
