import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, PersonaType, Property, PayPalTransaction, ThreeDAction, MapFocusAction } from '../types';
import { extractActionsFromText } from '../utils/paymentParser';
import { MarketTrendsChart } from './MarketTrendsChart';
import { Send, Sparkles, Building2, ArrowRight, ShieldCheck, RefreshCw, Bot, User, TrendingUp, X, Box, MapPin, Mic, MicOff, Volume2, FileText, Wrench, Users, AlertTriangle, Download } from 'lucide-react';
import { downloadAgreementPdf } from '../utils/pdfGenerator';

interface ChatBrokerProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  activePersona: PersonaType;
  properties: Property[];
  onTriggerPayPal: (tx: PayPalTransaction) => void;
  onTrigger3D?: (action: ThreeDAction) => void;
  onTriggerMap?: (action: MapFocusAction) => void;
  onNavigateTab: (tab: 'chat' | 'properties' | '3d' | 'map' | 'emi' | 'agreements' | 'owner') => void;
}

export const ChatBroker: React.FC<ChatBrokerProps> = ({
  messages,
  setMessages,
  activePersona,
  properties,
  onTriggerPayPal,
  onTrigger3D,
  onTriggerMap,
  onNavigateTab,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTrendsInChat, setShowTrendsInChat] = useState<boolean>(false);
  const [chatTrendsLocation, setChatTrendsLocation] = useState<string>('Downtown');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          setIsListening(false);
          // Automatically send the voice input
          handleSend(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!speechRecognitionRef.current) return;
    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        speechRecognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech recognition start error:', err);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const lowerText = text.toLowerCase();
    if (lowerText.includes('trend') || lowerText.includes('market') || lowerText.includes('d3')) {
      setShowTrendsInChat(true);
      if (lowerText.includes('heights') || lowerText.includes('102') || lowerText.includes('villa')) {
        setChatTrendsLocation('Heights');
      } else if (lowerText.includes('tech park') || lowerText.includes('103') || lowerText.includes('commercial') || lowerText.includes('studio')) {
        setChatTrendsLocation('Tech Park');
      } else if (lowerText.includes('downtown') || lowerText.includes('101')) {
        setChatTrendsLocation('Downtown');
      }
    }

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          activePersona,
          customProperties: properties,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const rawReply = data.reply || 'I am ready to assist you.';
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
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        sender: 'assistant',
        content: `I encountered an issue connecting to the brokerage core (${err.message || 'Network error'}). Please try again or choose one of the structured brokerage options.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const renterSuggestions = [
    'Draft 11-Month Lease Agreement (PROP-101)',
    'Split $1,200 Rent between 3 Roommates',
    'Log High-Severity Plumbing Leak Ticket',
    'Check Neighborhood Safety Score & Amenities',
    'Tour Living Room in 3D (PROP-101)',
    'Calculate 60-Month EMI for Villa (PROP-102)',
  ];

  const ownerSuggestions = [
    'Show 5-Year Investment Yield for Villa (PROP-102)',
    'Appraise fair market rent for a 2-BHK in Downtown',
    'View Micro-District Valuation & Rent Trends (D3)',
    'Generate standard landlord terms & deposit structure',
    'Request monthly rent collection of $1,200 via PayPal',
  ];

  const activeSuggestions = activePersona === 'client' ? renterSuggestions : ownerSuggestions;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render message content with formatted markdown and Action trigger cards
  const renderMessageContent = (msg: ChatMessage) => {
    // Filter out the raw json block from main display if parsed
    const filteredContent = (
      msg.detectedPayment ||
      msg.detected3DAction ||
      msg.detectedMapAction ||
      msg.detectedContract ||
      msg.detectedMaintenance ||
      msg.detectedSplitRent
    )
      ? msg.content.replace(/```(?:json)?\s*[\s\S]*?```/g, '').trim()
      : msg.content;

    return (
      <div className="space-y-3">
        <div className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
          {filteredContent}
        </div>

        {/* 3D Scene Trigger Card */}
        {msg.detected3DAction && (
          <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-indigo-950 to-slate-900 text-white border border-indigo-700/50 shadow-md animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-800/60">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Three.js 3D Virtual Tour Ready
                </span>
              </div>
              <span className="font-mono-tabular text-xs font-semibold px-2 py-0.5 rounded bg-indigo-800/80 text-indigo-200">
                {msg.detected3DAction.property_id || msg.detected3DAction.model_id}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">
                  Focused Room: {msg.detected3DAction.target_room}
                </div>
                <div className="text-xs text-indigo-300 mt-0.5">
                  Interactive orbit, daytime/sunset/night lighting, ceiling cutaway
                </div>
              </div>
              <button
                type="button"
                onClick={() => onTrigger3D && onTrigger3D(msg.detected3DAction!)}
                className="shrink-0 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs py-2 px-3.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <span>Launch 3D</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Google Maps Location Trigger Card */}
        {msg.detectedMapAction && (
          <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300/60 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Google Maps Location Routing
                </span>
              </div>
              <span className="font-mono-tabular text-xs font-semibold px-2 py-0.5 rounded bg-emerald-200/70 text-emerald-900">
                {msg.detectedMapAction.property_id}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {msg.detectedMapAction.location} District
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Coordinates: {msg.detectedMapAction.coordinates.lat.toFixed(4)}, {msg.detectedMapAction.coordinates.lng.toFixed(4)} · Transit & POIs
                </div>
              </div>
              <button
                type="button"
                onClick={() => onTriggerMap && onTriggerMap(msg.detectedMapAction!)}
                className="shrink-0 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2 px-3.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <span>View on Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Digital Legal Contract Card */}
        {msg.detectedContract && (
          <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/40 border-2 border-amber-300/80 shadow-md animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  {msg.detectedContract.contract_type === 'RENTAL_AGREEMENT'
                    ? 'Digital Residential Lease Agreement Draft'
                    : 'Digital Purchase Intent Contract Draft'}
                </span>
              </div>
              <span className="font-mono-tabular text-xs font-bold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
                {msg.detectedContract.property_id}
              </span>
            </div>
            <div className="py-2.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
                <span>Lease Term: <strong className="text-slate-900 font-bold">{msg.detectedContract.term_months} Months</strong></span>
                <span>Monthly Rent: <strong className="text-slate-900 font-bold font-mono-tabular">${Number(msg.detectedContract.monthly_rent || 1200).toLocaleString()}/mo</strong></span>
                <span>Deposit: <strong className="text-amber-800 font-bold font-mono-tabular">${Number(msg.detectedContract.security_deposit || 200).toLocaleString()}</strong></span>
              </div>
              <p className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-amber-200/60 leading-relaxed">
                Legally structured covenants: 60-day notice period, 14-day security deposit refund timeline, and prompt 48-hour structural maintenance warranty.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = properties.find((p) => p.id === msg.detectedContract!.property_id) || properties[0];
                  downloadAgreementPdf({
                    property: target,
                    signatureName: 'Alexander Wright',
                    signatureDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                    isSigned: false,
                    termMonths: msg.detectedContract!.term_months || 11,
                  });
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-amber-300 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-700" />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('agreements')}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Review & Counter-Sign in Agreement Vault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Maintenance Dispatch Ticket Card */}
        {msg.detectedMaintenance && (
          <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-rose-50 to-amber-50/40 border-2 border-rose-300/80 shadow-md animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-rose-200">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-rose-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
                  Maintenance & Repair Ticket Logged
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  msg.detectedMaintenance.severity === 'High' || msg.detectedMaintenance.severity === 'Emergency'
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {msg.detectedMaintenance.severity} Priority
                </span>
                <span className="font-mono-tabular text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  {msg.detectedMaintenance.status}
                </span>
              </div>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{msg.detectedMaintenance.issue_type}</span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Property: <span className="font-semibold">{msg.detectedMaintenance.property_id}</span> · Estimated Repair: <span className="font-bold text-rose-700 font-mono-tabular">${Number(msg.detectedMaintenance.estimated_cost || 150).toLocaleString()} USD</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('owner')}
                className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <span>Landlord Operations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Roommate Split Rent Payment Card */}
        {msg.detectedSplitRent && (
          <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50/50 border-2 border-violet-300/80 shadow-md animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-violet-200">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-violet-900">
                  Roommate Split Rent Breakdown
                </span>
              </div>
              <span className="font-mono-tabular text-xs font-bold px-2 py-0.5 rounded bg-violet-200/80 text-violet-900">
                {msg.detectedSplitRent.roommates_count} Roommates
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-600">
                  Total Monthly Rent: <strong className="text-slate-900 font-mono-tabular font-bold">${Number(msg.detectedSplitRent.total_rent).toLocaleString()}/mo</strong>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Property {msg.detectedSplitRent.property_id} · Equal per-roommate allocation
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono-tabular text-xl font-extrabold text-violet-900">
                  ${Number(msg.detectedSplitRent.per_person_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-violet-700 uppercase tracking-wider font-semibold">
                  Per Person / Month
                </div>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onTriggerPayPal({
                    action: 'INITIATE_PAYPAL_PAYMENT',
                    payment_category: 'SPLIT_RENT',
                    property_id: msg.detectedSplitRent!.property_id,
                    property_title: `Roommate Share (${msg.detectedSplitRent!.property_id})`,
                    amount: msg.detectedSplitRent!.per_person_amount.toString(),
                    currency: 'USD',
                    details: `Roommate rent split (${msg.detectedSplitRent!.per_person_amount} of total $${msg.detectedSplitRent!.total_rent} among ${msg.detectedSplitRent!.roommates_count} people)`,
                  });
                }}
                className="w-full bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="italic font-serif">Pay<span className="text-[#0079C1]">Pal</span></span>
                <span>Pay My Roommate Share (${Number(msg.detectedSplitRent.per_person_amount).toLocaleString()})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Highlighted PayPal Payment Card */}
        {msg.detectedPayment && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-[#0079C1]/30 shadow-md animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between pb-2.5 border-b border-blue-200/50">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#003087] tracking-tight font-serif italic text-base">
                  Pay<span className="text-[#0079C1]">Pal</span>
                </span>
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  {msg.detectedPayment.payment_category === 'RENTAL_DEPOSIT'
                    ? 'Rental Token Deposit Escrow'
                    : msg.detectedPayment.payment_category === 'EMI_INSTALLMENT'
                    ? 'Property Purchase EMI Subscription'
                    : 'Rent Collection Payment'}
                </span>
              </div>
              <span className="font-mono-tabular text-xs font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                {msg.detectedPayment.property_id}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {msg.detectedPayment.property_title}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {msg.detectedPayment.details || 'Secured broker transaction to reserve property'}
                </div>
                {msg.detectedPayment.tenure_months && (
                  <div className="text-xs text-blue-800 font-medium mt-1">
                    Tenure: {msg.detectedPayment.tenure_months} Months · Downpayment: ${msg.detectedPayment.downpayment || '20,000'}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono-tabular text-2xl font-extrabold text-slate-900">
                  ${Number(msg.detectedPayment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  {msg.detectedPayment.payment_category === 'EMI_INSTALLMENT' ? 'Monthly Installment' : 'Refundable Deposit'}
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => onTriggerPayPal(msg.detectedPayment!)}
                className="flex-1 bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-bold text-sm py-2.5 px-4 rounded-xl shadow-xs transition-transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="italic font-serif">Pay<span className="text-[#0079C1]">Pal</span></span>
                <span>Checkout · ${Number(msg.detectedPayment.amount).toLocaleString()}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('agreements')}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                Review Digital Lease Draft
              </button>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Full PayPal buyer & tenant protection with automated escrow confirmation</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto p-4 md:p-6">
      {/* Top Broker Status Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-700 text-white flex items-center justify-center shadow-xs">
            <Building2 className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">
                EstateMind AI Desk
              </h1>
              <span className="text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                Personal Real Estate Assistant
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Assisting:{' '}
              <span className="font-semibold text-slate-700">
                {activePersona === 'client' ? 'Client / Renter / Buyer' : 'Owner / Landlord / Rentee'}
              </span>{' '}
              · Gemini 3.8 Intelligence
            </div>
          </div>
        </div>

        {/* Quick Nav Strip */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <button
            type="button"
            onClick={() => onNavigateTab('3d')}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Box className="w-3.5 h-3.5 text-indigo-600" />
            <span>3D Virtual Tour</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('map')}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Maps</span>
          </button>
          <button
            type="button"
            onClick={() => setShowTrendsInChat(!showTrendsInChat)}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              showTrendsInChat
                ? 'bg-blue-900 text-white shadow-2xs'
                : 'bg-blue-50 text-blue-900 hover:bg-blue-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            <span>{showTrendsInChat ? 'Hide D3' : 'Market Trends'}</span>
          </button>
          <button
            onClick={() => onNavigateTab('properties')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
          >
            Properties
          </button>
          <button
            onClick={() => onNavigateTab('emi')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
          >
            EMI Studio
          </button>
          <button
            onClick={() =>
              setMessages([
                {
                  id: 'msg-welcome',
                  sender: 'assistant',
                  content: `👋 **Hello! I am EstateMind AI**, your warm, clear real estate broker assistant.\n\nI make finding, exploring, and securing your next property effortless:\n- 🏠 **Smart Matching**: Clean listings with price, location & key features.\n- 🌐 **3D Walkthroughs**: Step inside interactive 3D rooms anytime.\n- 📍 **Google Maps**: Check transit, commute times & local amenities.\n- 💰 **EMI & Rent Tables**: Clear, simple financial breakdowns.\n- 💳 **PayPal Checkout**: Lock token deposits or set up monthly EMI plans.\n\n*Would you like to explore available listings, tour a room in 3D, or check out local maps?*`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ])
            }
            title="Reset conversation"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Embedded D3.js Market Trends Drawer in Chat */}
      {showTrendsInChat && (
        <div className="mb-4 relative animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="absolute right-3 top-3 z-10">
            <button
              onClick={() => setShowTrendsInChat(false)}
              className="p-1 text-slate-400 hover:text-slate-700 bg-white/80 rounded-full hover:bg-slate-100 cursor-pointer"
              aria-label="Close trends chart"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <MarketTrendsChart
            key={chatTrendsLocation}
            initialLocation={chatTrendsLocation}
            isCompact={true}
          />
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 md:p-6 overflow-y-auto space-y-4 shadow-xs">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                  isUser
                    ? 'bg-slate-800 text-white'
                    : 'bg-gradient-to-tr from-blue-900 to-indigo-700 text-amber-300'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`rounded-2xl px-5 py-4 shadow-xs ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span
                    className={`text-[11px] font-semibold ${
                      isUser ? 'text-slate-300' : 'text-blue-900'
                    }`}
                  >
                    {isUser ? 'You' : 'EstateMind AI'}
                  </span>
                  <span
                    className={`text-[10px] ${
                      isUser ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {renderMessageContent(msg)}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-2xl mr-auto">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-900 to-indigo-700 text-amber-300 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-slate-600 text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-500 ml-1">Analyzing database, 3D scenes & market routing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Quick Actions:
        </span>
        {activeSuggestions.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 hover:text-blue-900 border border-slate-200 px-3 py-1.5 rounded-full transition-all whitespace-nowrap shrink-0 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input Bar with Live Voice Toggle */}
      <div className="mt-1 relative bg-white border border-slate-300 rounded-2xl shadow-xs overflow-hidden focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? "Listening... Speak your property request now"
              : activePersona === 'client'
              ? "Ask for 3D walkthrough, Google Maps routing, lock deposit, or EMI breakdown..."
              : "Ask for fair market appraisal, security deposit terms, or PayPal rent collection..."
          }
          disabled={isLoading}
          className="flex-1 pl-4 pr-24 py-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
        />

        <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1.5">
          {/* Live Voice Input Toggle */}
          {speechSupported && (
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? 'Stop listening' : 'Start voice mode (Live speech)'}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            aria-label="Send message to EstateGenius AI"
            className="px-3 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer h-full"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
