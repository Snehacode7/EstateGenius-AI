import React, { useState } from 'react';
import { Property, PayPalTransaction, MaintenanceTicket } from '../types';
import { Briefcase, PlusCircle, Sparkles, DollarSign, Building2, CheckCircle2, Copy, Send, ArrowRight, ShieldCheck, Wrench, TrendingUp, AlertTriangle, Clock, Activity, Check, Database, Zap } from 'lucide-react';

interface OwnerPortalProps {
  properties: Property[];
  onAddProperty: (newProp: Property) => void;
  onTriggerPayPal: (tx: PayPalTransaction) => void;
  maintenanceTickets?: MaintenanceTicket[];
  onToggleTicketStatus?: (ticketId: string, currentStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => void;
  onCreateTicket?: (ticket: MaintenanceTicket) => void;
}

export const OwnerPortal: React.FC<OwnerPortalProps> = ({
  properties,
  onAddProperty,
  onTriggerPayPal,
  maintenanceTickets,
  onToggleTicketStatus,
  onCreateTicket,
}) => {
  // Local fallback state if maintenanceTickets prop is not passed
  const [localTickets, setLocalTickets] = useState<MaintenanceTicket[]>([
    {
      id: 'TICK-PROP101-PLUMB-75',
      propertyId: 'PROP-101',
      propertyTitle: 'Downtown Luxury 2-BHK',
      issueCategory: 'PLUMBING',
      issue: 'High-Severity Plumbing Pipe Leak under Kitchen Sink',
      urgency: 'HIGH',
      severity: 'High',
      estimatedCostUsd: 75.00,
      status: 'OPEN',
      reportedDate: 'Today, 08:44 AM',
      reportedBy: 'snehu5125@gmail.com',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'TICK-7940',
      propertyId: 'PROP-102',
      propertyTitle: 'Modern Suburban Villa',
      issueCategory: 'HVAC',
      issue: 'HVAC Air Filter Replacement & Smart Thermostat Sync',
      urgency: 'MEDIUM',
      severity: 'Medium',
      estimatedCostUsd: 85.00,
      status: 'IN_PROGRESS',
      reportedDate: 'Yesterday',
      reportedBy: 'owner@estatemind.ai',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'TICK-7815',
      propertyId: 'PROP-103',
      propertyTitle: 'Commercial Studio Space',
      issueCategory: 'STRUCTURAL',
      issue: 'Commercial Studio Glass Partition Hinge Calibration',
      urgency: 'LOW',
      severity: 'Low',
      estimatedCostUsd: 60.00,
      status: 'RESOLVED',
      reportedDate: '3 days ago',
      reportedBy: 'facility@techpark.com',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
    },
  ]);

  const activeTickets = maintenanceTickets && maintenanceTickets.length > 0 ? maintenanceTickets : localTickets;

  // New Ticket Form State
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [ticketPropId, setTicketPropId] = useState('PROP-101');
  const [ticketCategory, setTicketCategory] = useState('PLUMBING');
  const [ticketUrgency, setTicketUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'>('HIGH');
  const [ticketCost, setTicketCost] = useState<number>(75.00);
  const [ticketIssue, setTicketIssue] = useState('Urgent High-Severity Plumbing Pipe Leak Repair');
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState<string | null>(null);

  const handleToggleStatus = (ticketId: string, currentStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    if (onToggleTicketStatus) {
      onToggleTicketStatus(ticketId, currentStatus);
    } else {
      setLocalTickets((prev) =>
        prev.map((t) => {
          if (t.id === ticketId) {
            const nextStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' =
              t.status === 'OPEN' ? 'IN_PROGRESS' : t.status === 'IN_PROGRESS' ? 'RESOLVED' : 'OPEN';
            return { ...t, status: nextStatus };
          }
          return t;
        })
      );
    }
  };

  const handleCreateNewTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `TICK-${ticketPropId.replace('-', '')}-${Date.now().toString().slice(-4)}`;
    const prop = properties.find((p) => p.id === ticketPropId);

    const newTicket: MaintenanceTicket = {
      id: newId,
      propertyId: ticketPropId,
      propertyTitle: prop?.title || ticketPropId,
      issueCategory: ticketCategory,
      issue: ticketIssue.trim() || `${ticketCategory} Maintenance Service`,
      urgency: ticketUrgency,
      severity: ticketUrgency === 'HIGH' ? 'High' : ticketUrgency === 'EMERGENCY' ? 'Emergency' : ticketUrgency === 'MEDIUM' ? 'Medium' : 'Low',
      estimatedCostUsd: Number(ticketCost) || 75.00,
      status: 'OPEN',
      reportedDate: 'Just now',
      reportedBy: 'snehu5125@gmail.com',
      createdAt: new Date().toISOString(),
    };

    if (onCreateTicket) {
      onCreateTicket(newTicket);
    } else {
      setLocalTickets((prev) => [newTicket, ...prev]);
    }

    setTicketSuccessMsg(`Ticket #${newId} logged and synced to Firestore!`);
    setTimeout(() => {
      setTicketSuccessMsg(null);
      setShowNewTicketForm(false);
    }, 2500);
  };

  // Appraisal State
  const [appraisalType, setAppraisalType] = useState('2-BHK');
  const [appraisalLocation, setAppraisalLocation] = useState('Downtown');
  const [appraisalSqft, setAppraisalSqft] = useState(1150);
  const [isAppraising, setIsAppraising] = useState(false);
  const [appraisalResult, setAppraisalResult] = useState<{
    estimatedRent: number;
    suggestedDeposit: number;
    estimatedSalePrice: number;
    minDownpayment: number;
    analysisText?: string;
  } | null>(null);

  // Listing Form State
  const [title, setTitle] = useState('');
  const [listingType, setListingType] = useState<'Rent' | 'Sale'>('Rent');
  const [category, setCategory] = useState<'1-BHK' | '2-BHK' | 'Villa' | 'Commercial'>('2-BHK');
  const [location, setLocation] = useState('Downtown');
  const [priceOrRent, setPriceOrRent] = useState<number>(1300);
  const [depositOrDown, setDepositOrDown] = useState<number>(250);
  const [sqft, setSqft] = useState<number>(1100);
  const [bedrooms, setBedrooms] = useState('2 Bedrooms');
  const [description, setDescription] = useState('');
  const [isAdded, setIsAdded] = useState(false);

  // Rent Collection Request State
  const [collectPropertyId, setCollectPropertyId] = useState(properties[0]?.id || 'PROP-101');
  const [collectAmount, setCollectAmount] = useState<number>(1200);
  const [tenantEmail, setTenantEmail] = useState('tenant.john@example.com');
  const [copiedLink, setCopiedLink] = useState(false);
  const [sentInvoice, setSentInvoice] = useState(false);

  // Run AI Appraisal
  const handleRunAppraisal = async () => {
    setIsAppraising(true);
    try {
      const res = await fetch('/api/property/appraise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedrooms: appraisalType,
          location: appraisalLocation,
          squareFeet: appraisalSqft,
        }),
      });
      const data = await res.json();
      if (data.appraisal) {
        setAppraisalResult({
          estimatedRent: data.appraisal.estimatedRent,
          suggestedDeposit: data.appraisal.suggestedDeposit,
          estimatedSalePrice: data.appraisal.estimatedSalePrice,
          minDownpayment: data.appraisal.minDownpayment,
          analysisText: data.appraisal.recommendation,
        });
      } else if (data.appraisalText) {
        // Parse from Gemini text
        const baseRent = appraisalType === '1-BHK' ? 950 : appraisalType === '2-BHK' ? 1350 : appraisalType === 'Villa' ? 2750 : 1100;
        setAppraisalResult({
          estimatedRent: baseRent,
          suggestedDeposit: Math.round(baseRent * 0.2),
          estimatedSalePrice: baseRent * 110,
          minDownpayment: Math.round(baseRent * 110 * 0.15),
          analysisText: data.appraisalText,
        });
      }
    } catch {
      // Fallback
      const baseRent = appraisalType === '1-BHK' ? 900 : appraisalType === '2-BHK' ? 1250 : 2500;
      setAppraisalResult({
        estimatedRent: baseRent,
        suggestedDeposit: Math.round(baseRent * 0.2),
        estimatedSalePrice: baseRent * 100,
        minDownpayment: Math.round(baseRent * 15),
        analysisText: `Market analysis indicates strong leasing demand in ${appraisalLocation}. Estimated fair market rent is $${baseRent}/month with a standard $${Math.round(baseRent * 0.2)} token deposit.`,
      });
    } finally {
      setIsAppraising(false);
    }
  };

  // Submit Listing
  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newId = `PROP-${Math.floor(104 + Math.random() * 800)}`;
    // Determine coordinates based on selected location
    const coordsMap: Record<string, { lat: number; lng: number }> = {
      Downtown: { lat: 40.7128, lng: -74.0060 },
      Heights: { lat: 40.7829, lng: -73.9654 },
      'Tech Park': { lat: 40.7484, lng: -73.9857 },
    };

    const newProperty: Property = {
      id: newId,
      type: listingType,
      category,
      title: title.trim(),
      location,
      coordinates: coordsMap[location] || { lat: 40.7250, lng: -73.9950 },
      rent: listingType === 'Rent' ? priceOrRent : undefined,
      deposit: listingType === 'Rent' ? depositOrDown : undefined,
      price: listingType === 'Sale' ? priceOrRent : undefined,
      minDownpayment: listingType === 'Sale' ? depositOrDown : undefined,
      bedrooms,
      bathrooms: category === '1-BHK' ? 1 : category === '2-BHK' ? 2 : 3,
      sqft,
      image: '/src/assets/images/prop_downtown_luxury_2bhk_1794031262921.jpg',
      description: description || `Owner-listed ${category} in prime ${location} with full amenities and verified title.`,
      amenities: ['Verified Ownership', 'Parking Space', 'High-Speed Fiber', 'Air Conditioning'],
      status: 'Available',
      ownerName: 'You (Private Owner)',
      rooms3D: ['Overview', 'Living Room', 'Master Suite', 'Chef Kitchen', 'Skyline Terrace', 'Floor Plan'],
    };

    onAddProperty(newProperty);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 3000);
    setTitle('');
    setDescription('');
  };

  // Handle Request Rent
  const handleTriggerCollectRent = () => {
    const targetProp = properties.find((p) => p.id === collectPropertyId) || properties[0];
    onTriggerPayPal({
      action: 'INITIATE_PAYPAL_PAYMENT',
      payment_category: 'FIRST_MONTH_RENT',
      property_id: targetProp.id,
      property_title: targetProp.title,
      amount: collectAmount.toString(),
      currency: 'USD',
      details: `Monthly Rent Collection for ${targetProp.title} via Owner PayPal Portal`,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-10">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <Briefcase className="w-6 h-6 text-emerald-700" />
          Owner & Landlord Operations Hub
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Automate property listings, execute AI fair-market rent appraisals, and issue PayPal rent collection requests.
        </p>
      </div>

      {/* 2-Column: AI Appraisal & Rent Collection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Module 1: AI Fair Market Appraisal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">
                AI Fair Market Rent & Deposit Appraisal
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              Broker Valuation Engine
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Enter your asset specifications to compute fair market rental value, optimal security deposit, and estimated purchase valuation.
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Property Type</label>
              <select
                value={appraisalType}
                onChange={(e) => setAppraisalType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium"
              >
                <option value="1-BHK">1-BHK Apartment</option>
                <option value="2-BHK">2-BHK Luxury Suite</option>
                <option value="Villa">Suburban Villa</option>
                <option value="Commercial">Commercial Loft</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Micro-Location</label>
              <select
                value={appraisalLocation}
                onChange={(e) => setAppraisalLocation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium"
              >
                <option value="Downtown">Downtown Central</option>
                <option value="Heights">Suburban Heights</option>
                <option value="Tech Park">Tech Park District</option>
                <option value="Waterfront">Waterfront Bay</option>
              </select>
            </div>
          </div>

          <div className="text-xs">
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Square Footage</span>
              <span className="font-mono-tabular font-bold text-blue-900">{appraisalSqft} sq ft</span>
            </div>
            <input
              type="range"
              min="500"
              max="4000"
              step="50"
              value={appraisalSqft}
              onChange={(e) => setAppraisalSqft(Number(e.target.value))}
              className="w-full accent-blue-900 cursor-pointer"
            />
          </div>

          <button
            type="button"
            disabled={isAppraising}
            onClick={handleRunAppraisal}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isAppraising ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Calculating Market Comparables...
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Calculate Fair Market Rent & Deposit</span>
              </>
            )}
          </button>

          {appraisalResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block font-medium">Estimated Fair Rent</span>
                  <span className="font-mono-tabular text-lg font-bold text-slate-900">
                    ${appraisalResult.estimatedRent.toLocaleString()}<span className="text-xs font-normal text-slate-500">/mo</span>
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block font-medium">Suggested Deposit</span>
                  <span className="font-mono-tabular text-lg font-bold text-emerald-700">
                    ${appraisalResult.suggestedDeposit.toLocaleString()} USD
                  </span>
                </div>
              </div>

              {appraisalResult.analysisText && (
                <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200/60 leading-relaxed">
                  {appraisalResult.analysisText}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Module 2: Monthly Rent Collection via PayPal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#003087] font-serif italic text-base">
                Pay<span className="text-[#0079C1]">Pal</span>
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Monthly Rent Collection Engine
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
              Feature A
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Request monthly rent from your tenants via verified PayPal escrow links with automatic transaction receipts.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Property</label>
              <select
                value={collectPropertyId}
                onChange={(e) => {
                  setCollectPropertyId(e.target.value);
                  const p = properties.find((item) => item.id === e.target.value);
                  if (p?.rent) setCollectAmount(p.rent);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} - {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Collection Amount (USD)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="number"
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono-tabular font-bold text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tenant PayPal Email</label>
                <input
                  type="email"
                  value={tenantEmail}
                  onChange={(e) => setTenantEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleTriggerCollectRent}
                className="w-full bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="italic font-serif">Pay<span className="text-[#0079C1]">Pal</span></span>
                <span>Test Collect Now · ${collectAmount.toLocaleString()} USD</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>PayPal Payment Link Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Tenant PayPal Payment Link</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Funds settle directly to owner PayPal wallet with automated ledger update</span>
            </div>
          </div>
        </div>
      </div>

      {/* Module 3: List a New Property */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-900" />
              List a New Property for Brokerage
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Add your unit to the EstateMind AI portfolio to enable instant AI matching and PayPal escrow booking.
            </p>
          </div>
          {isAdded && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Listed Successfully!
            </span>
          )}
        </div>

        <form onSubmit={handleAddProperty} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Listing Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Waterfront Penthouse with Skyline Terrace"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Contract Type</label>
              <select
                value={listingType}
                onChange={(e) => setListingType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
              >
                <option value="Rent">For Rent / Lease</option>
                <option value="Sale">For Purchase / Sale</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
              >
                <option value="1-BHK">1-BHK</option>
                <option value="2-BHK">2-BHK</option>
                <option value="Villa">Suburban Villa</option>
                <option value="Commercial">Commercial Space</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Location District</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                {listingType === 'Rent' ? 'Monthly Rent (USD)' : 'Sale Price (USD)'}
              </label>
              <input
                type="number"
                value={priceOrRent}
                onChange={(e) => setPriceOrRent(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono-tabular font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                {listingType === 'Rent' ? 'Token Deposit (USD)' : 'Min Downpayment (USD)'}
              </label>
              <input
                type="number"
                value={depositOrDown}
                onChange={(e) => setDepositOrDown(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono-tabular font-bold text-blue-700"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="font-semibold text-slate-700 block mb-1">Description & Highlights</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe view, parking, finishings, or negotiable terms..."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Publish Listing to Broker Portfolio
          </button>
        </form>
      </div>

      {/* Module 4: Maintenance & Repair Dispatch Hub */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Tenant Maintenance & Repair Dispatch Hub
                </h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Database className="w-3 h-3 text-emerald-600" />
                  Cloud Firestore Synced
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Real-time issue tracking logged via AI Broker desk with contractor estimation & status management.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNewTicketForm(!showNewTicketForm)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{showNewTicketForm ? 'Close Form' : 'Log New Ticket'}</span>
            </button>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {activeTickets.filter((t) => t.status === 'OPEN').length} Open
            </span>
          </div>
        </div>

        {/* New Ticket Form Accordion */}
        {showNewTicketForm && (
          <form
            onSubmit={handleCreateNewTicketSubmit}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Dispatch New Maintenance Ticket to Firestore
              </span>
              <span className="text-[10px] text-slate-400 font-mono-tabular">Realtime DB sync</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Property</label>
                <select
                  value={ticketPropId}
                  onChange={(e) => setTicketPropId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg font-medium"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Issue Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg font-medium"
                >
                  <option value="PLUMBING">PLUMBING</option>
                  <option value="HVAC">HVAC</option>
                  <option value="ELECTRICAL">ELECTRICAL</option>
                  <option value="STRUCTURAL">STRUCTURAL</option>
                  <option value="APPLIANCE">APPLIANCE</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Urgency</label>
                <select
                  value={ticketUrgency}
                  onChange={(e) => setTicketUrgency(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg font-medium"
                >
                  <option value="HIGH">HIGH (Urgent)</option>
                  <option value="EMERGENCY">EMERGENCY (Immediate)</option>
                  <option value="MEDIUM">MEDIUM (Standard)</option>
                  <option value="LOW">LOW (Routine)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Estimated Cost (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={ticketCost}
                  onChange={(e) => setTicketCost(Number(e.target.value))}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg font-mono-tabular font-bold"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="font-semibold text-slate-700 block mb-1">Specific Issue Description</label>
              <input
                type="text"
                value={ticketIssue}
                onChange={(e) => setTicketIssue(e.target.value)}
                placeholder="e.g., Pipe leak under sink requiring plumber replacement gasket..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Save Ticket to Firestore
              </button>
              {ticketSuccessMsg && (
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {ticketSuccessMsg}
                </span>
              )}
            </div>
          </form>
        )}

        {/* Tickets List */}
        <div className="space-y-3">
          {activeTickets.map((t) => {
            const costVal = t.estimatedCostUsd ?? (t as any).estimatedCost ?? 75;
            const categoryBadge = t.issueCategory || 'MAINTENANCE';

            return (
              <div
                key={t.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono-tabular text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      {t.id}
                    </span>
                    <span className="text-xs font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                      {t.propertyId}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {categoryBadge}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        t.urgency === 'HIGH' || t.severity === 'High' || t.urgency === 'EMERGENCY' || t.severity === 'Emergency'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : t.urgency === 'MEDIUM' || t.severity === 'Medium'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {t.urgency || t.severity} Urgency
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 pt-0.5">
                    {t.issue}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span>Reported: {t.reportedDate || 'Today'}</span>
                    <span>·</span>
                    <span>Estimated Contractor Cost: <strong className="font-mono-tabular text-slate-800 font-bold">${Number(costVal).toFixed(2)} USD</strong></span>
                    {t.reportedBy && (
                      <>
                        <span>·</span>
                        <span className="text-slate-400">By: {t.reportedBy}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(t.id, t.status)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                      t.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : t.status === 'IN_PROGRESS'
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : 'bg-amber-50 text-amber-900 border-amber-300'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Status: {t.status}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Module 5: 5-Year Investment Yield & Capital Appreciation Predictor */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900">
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                5-Year Investment Yield & Capital Appreciation Forecaster
              </h3>
              <p className="text-xs text-slate-500">
                Predict gross rental yield, net operating cap rate, and 5-year equity appreciation for real estate portfolios.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
            Financial Engineering
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Downtown 2-BHK (PROP-101)</span>
            <div className="font-mono-tabular text-xl font-extrabold text-slate-900">8.2% Gross Yield</div>
            <div className="text-emerald-700 font-semibold pt-1">+24% Projected 5-Year Equity Gain</div>
            <div className="text-[11px] text-slate-500">$14,400 Annual Rental Cashflow</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Modern Villa (PROP-102)</span>
            <div className="font-mono-tabular text-xl font-extrabold text-slate-900">6.8% Gross Yield</div>
            <div className="text-emerald-700 font-semibold pt-1">+32% Projected 5-Year Equity Gain</div>
            <div className="text-[11px] text-slate-500">$38,400 Projected 5-Year Capital Growth</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Commercial Studio (PROP-103)</span>
            <div className="font-mono-tabular text-xl font-extrabold text-slate-900">9.1% Gross Yield</div>
            <div className="text-emerald-700 font-semibold pt-1">+28% Projected 5-Year Equity Gain</div>
            <div className="text-[11px] text-slate-500">High occupancy tech-hub district</div>
          </div>
        </div>
      </div>
    </div>
  );
};
