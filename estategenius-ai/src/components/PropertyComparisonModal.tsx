import React, { useState, useMemo } from 'react';
import { Property, PayPalTransaction } from '../types';
import {
  Scale,
  X,
  Check,
  Minus,
  MapPin,
  Building2,
  Box,
  Calculator,
  FileText,
  Printer,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Maximize2,
  BedDouble,
  Bath,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { PropertyGalleryCarousel } from './PropertyGalleryCarousel';

interface PropertyComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparedProperties: Property[];
  allProperties: Property[];
  onAddProperty: (propertyId: string) => void;
  onRemoveProperty: (propertyId: string) => void;
  onClearComparison: () => void;
  onTriggerPayPal: (tx: PayPalTransaction) => void;
  onSelectPropertyForEmi: (property: Property) => void;
  onSelectPropertyFor3D?: (property: Property) => void;
  onSelectPropertyForMap?: (property: Property) => void;
  onAskBrokerAboutProperty: (property: Property) => void;
  onSelectPropertyForAgreement: (property: Property) => void;
}

export const PropertyComparisonModal: React.FC<PropertyComparisonModalProps> = ({
  isOpen,
  onClose,
  comparedProperties,
  allProperties,
  onAddProperty,
  onRemoveProperty,
  onClearComparison,
  onTriggerPayPal,
  onSelectPropertyForEmi,
  onSelectPropertyFor3D,
  onSelectPropertyForMap,
  onAskBrokerAboutProperty,
  onSelectPropertyForAgreement,
}) => {
  if (!isOpen) return null;

  const [highlightDifferences, setHighlightDifferences] = useState<boolean>(false);
  const [showAddSelector, setShowAddSelector] = useState<boolean>(false);

  // Collect all unique amenities across all compared properties
  const allAmenities = useMemo(() => {
    const set = new Set<string>();
    comparedProperties.forEach((p) => {
      p.amenities?.forEach((a) => set.add(a));
    });
    // Standard baseline amenities if list is small
    const standardDefaults = [
      'Parking',
      'Balcony',
      'Modern Kitchen',
      'High-Speed Internet',
      'Central AC',
      'Gym / Fitness',
      '24/7 Security Patrol',
      'Elevator',
      'Concierge',
      'Pet Friendly',
    ];
    standardDefaults.forEach((d) => set.add(d));
    return Array.from(set).sort();
  }, [comparedProperties]);

  // Candidate properties not currently in comparison
  const availableToAdd = allProperties.filter(
    (p) => !comparedProperties.some((cp) => cp.id === p.id)
  );

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
    }
    onClose();
  };

  // Helper to check if values differ across compared properties
  const valuesDiffer = (extractor: (p: Property) => any) => {
    if (comparedProperties.length < 2) return false;
    const first = extractor(comparedProperties[0]);
    return comparedProperties.some((p) => extractor(p) !== first);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Side-by-Side Property Comparison</h3>
                <span className="text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-full">
                  {comparedProperties.length} / 3 Selected
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Compare features, pricing metrics, spatial scores, and amenities to make confident real estate decisions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Highlight Differences Toggle */}
            <button
              type="button"
              onClick={() => setHighlightDifferences(!highlightDifferences)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                highlightDifferences
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{highlightDifferences ? 'Highlighting Differences' : 'Highlight Differences'}</span>
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={() => window.print()}
              title="Print comparison table"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Clear All */}
            {comparedProperties.length > 0 && (
              <button
                type="button"
                onClick={onClearComparison}
                className="text-xs text-slate-300 hover:text-red-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close comparison modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {comparedProperties.length === 0 ? (
            /* Empty State */
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <Scale className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">No Properties Selected for Comparison</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Choose up to three properties from the catalog using the "Compare" button to view side-by-side pricing, floor space, safety ratings, and amenities.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>Browse Property Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Comparison Table Container */
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
              <table className="w-full text-left border-collapse min-w-[700px]">
                {/* Table Header: Property Cards */}
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 w-48 text-xs font-bold uppercase tracking-wider text-slate-400 align-top">
                      Feature & Specification
                    </th>

                    {comparedProperties.map((prop) => (
                      <th
                        key={`col-${prop.id}`}
                        className="p-4 w-64 align-top border-l border-slate-200 bg-white"
                      >
                        <div className="space-y-3">
                          <div className="relative rounded-xl overflow-hidden bg-slate-950 shadow-xs group/carousel">
                            <PropertyGalleryCarousel property={prop} mode="card" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveProperty(prop.id);
                              }}
                              title="Remove from comparison"
                              className="absolute top-2 right-2 z-20 p-1 bg-slate-950/80 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <span
                              className={`absolute top-2 left-2 z-20 text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-xs ${
                                prop.type === 'Rent' ? 'bg-blue-600' : 'bg-emerald-600'
                              }`}
                            >
                              {prop.type === 'Rent' ? 'For Rent' : 'For Sale'}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-blue-700 font-mono font-bold">
                              <span>{prop.id}</span>
                              <span>·</span>
                              <span className="text-slate-500 font-sans font-medium">{prop.category}</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-2">
                              {prop.title}
                            </h4>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="truncate">{prop.location}</span>
                            </div>
                          </div>

                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => handleDirectLock(prop)}
                              className="w-full bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-bold text-xs py-2 px-3 rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span className="italic font-serif">PayPal</span>
                              <span>{prop.type === 'Rent' ? `Lock $${prop.deposit}` : 'EMI Plan'}</span>
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}

                    {/* Placeholder Slot if fewer than 3 properties selected */}
                    {comparedProperties.length < 3 && (
                      <th className="p-4 w-60 align-middle border-l border-dashed border-slate-300 bg-slate-50/50 text-center">
                        <div className="p-4 space-y-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                            <Plus className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-700">Add Another Property</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Compare up to 3 units side-by-side
                            </div>
                          </div>

                          {showAddSelector ? (
                            <div className="space-y-1.5 pt-2 text-left">
                              {availableToAdd.length === 0 ? (
                                <div className="text-xs text-slate-400 text-center">All properties added</div>
                              ) : (
                                availableToAdd.map((p) => (
                                  <button
                                    key={`add-${p.id}`}
                                    type="button"
                                    onClick={() => {
                                      onAddProperty(p.id);
                                      setShowAddSelector(false);
                                    }}
                                    className="w-full p-2 text-xs bg-white hover:bg-blue-50 border border-slate-200 rounded-lg text-slate-800 font-medium transition-colors flex items-center justify-between text-left cursor-pointer"
                                  >
                                    <span className="truncate pr-1">{p.title}</span>
                                    <span className="font-mono text-[10px] text-blue-700 font-bold shrink-0">
                                      {p.id}
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowAddSelector(true)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                            >
                              Select Property +
                            </button>
                          )}
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                  {/* SECTION 1: FINANCIALS */}
                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <td
                      colSpan={comparedProperties.length + (comparedProperties.length < 3 ? 2 : 1)}
                      className="px-4 py-2 uppercase tracking-wider text-[11px] text-blue-900 bg-blue-50/60"
                    >
                      💰 Financials & Pricing Structure
                    </td>
                  </tr>

                  <tr className={highlightDifferences && valuesDiffer((p) => p.type === 'Rent' ? p.rent : p.price) ? 'bg-amber-50/60' : ''}>
                    <td className="p-4 font-semibold text-slate-600">Base Price / Rent</td>
                    {comparedProperties.map((p) => (
                      <td key={`price-${p.id}`} className="p-4 border-l border-slate-200 font-mono font-bold text-sm text-slate-900">
                        {p.type === 'Rent' ? (
                          <span>${p.rent?.toLocaleString()}<span className="text-xs font-normal text-slate-500"> / month</span></span>
                        ) : (
                          <span>${p.price?.toLocaleString()}</span>
                        )}
                      </td>
                    ))}
                    {comparedProperties.length < 3 && <td className="p-4 border-l border-slate-200 bg-slate-50/20" />}
                  </tr>

                  <tr className={highlightDifferences && valuesDiffer((p) => p.type === 'Rent' ? p.deposit : p.minDownpayment) ? 'bg-amber-50/60' : ''}>
                    <td className="p-4 font-semibold text-slate-600">Deposit / Downpayment</td>
                    {comparedProperties.map((p) => (
                      <td key={`deposit-${p.id}`} className="p-4 border-l border-slate-200 font-mono font-semibold text-slate-800">
                        {p.type === 'Rent' ? (
                          <span className="text-blue-700">${p.deposit || 200} USD (Token Escrow)</span>
                        ) : (
                          <span className="text-emerald-700">${p.minDownpayment?.toLocaleString()} USD (15-20%)</span>
                        )}
                      </td>
                    ))}
                    {comparedProperties.length < 3 && <td className="p-4 border-l border-slate-200 bg-slate-50/20" />}
                  </tr>

                  <tr className={highlightDifferences && valuesDiffer((p) => Math.round((p.price || (p.rent || 0) * 12) / p.sqft)) ? 'bg-amber-50/60' : ''}>
                    <td className="p-4 font-semibold text-slate-600">Est. Price / Sq Ft</td>
                    {comparedProperties.map((p) => {
                      const rate = p.type === 'Rent'
                        ? ((p.rent || 0) / p.sqft).toFixed(2) + ' / sqft / mo'
                        : '$' + Math.round((p.price || 0) / p.sqft) + ' / sqft';
                      return (
                        <td key={`sqft-rate-${p.id}`} className="p-4 border-l border-slate-200 font-mono text-slate-800">
                          {rate}
                        </td>
                      );
                    })}
                    {comparedProperties.length < 3 && <td className="p-4 border-l border-slate-200 bg-slate-50/20" />}
                  </tr>

                  <tr className={highlightDifferences && valuesDiffer((p) => p.rentalYield) ? 'bg-amber-50/60' : ''}>
                    <td className="p-4 font-semibold text-slate-600">Annual Rental Yield</td>
                    {comparedProperties.map((p) => (
                      <td key={`yield-${p.id}`} className="p-4 border-l border-slate-200 font-mono font-semibold text-blue-900">
                        {p.rentalYield || 8.2}%
                      </td>
                    ))}
                    {comparedProperties.length < 3 && <td className="p-4 border-l border-slate-200 bg-slate-50/20" />}
                  </tr>

                  <tr className={highlightDifferences && valuesDiffer((p) => p.fiveYearAppreciation) ? 'bg-amber-50/60' : ''}>
                    <td className="p-4 font-semibold text-slate-600">5-Year Projected Growth</td>
                    {comparedProperties.map((p) => (
                      <td key={`growth-${p.id}`} className="p-4 border-l border-slate-200 font-mono font-semibold text-emerald-700">
                        {p.fiveYearAppreciation || '+28%'}
                      </td>
                    ))}
                    {comparedProperties.length < 3 && <td className="p-4 border-l border-slate-200 bg-slate-50/20" />}
                  </tr>

                  {/* SECTION 2: PHYSICAL SPECS */}
                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <td
                      colSpan={comparedProperties.length + (comparedProperties.length < 3 ? 2 : 1)}
                      className="px-4 py-2 uppercase tracking-wider text-[11px] text-blue-900 bg-blue-50/60"
                    >
                      📐 Physical Dimensions & Layout
                    </td>
                  </tr>

                  <tr className={highlightDifferences && valuesDiffer((p) => p.bedrooms) ? 'bg-amber-50/60' : ''}>
                    <td className="p-4 font-semibold text-slate-600">Bedrooms</td>
                    {comparedProperties.map((p) => (
                      <td key={`bed-${p.id}`} className="p-4 border-l border-slate-200 font-medium">
                        {p.bedrooms}
                      </td>
                    ))}
                    {comparedProperties.length < 3 && <td className="p-4 border-l border-slate-200 bg-slate-50/20" />}
                  </tr>

                  <tr className={highlightDifferences && valuesDiffer((p) => p.bathrooms) ? 'bg-amber-50/60' : ''}>
                    <td className="p-4 font-semibold text-slate-600">Bathrooms</td>
                    {comparedProperties.map((p) => (
                      <td key={`bath-${p.id}`} className="p-4 border-l border-slate-200 font-medium">
                        {p.bathrooms} {p.bathrooms === 1 ? 'Bath' : 'Baths'}
                      </td>
                    ))}
                    {comparedProperties.length < 3 && <td className="p-4 border-l border-slate-200 bg-slate-50/20" />}
                  </tr>

                  <tr className={highlightDifferences && valuesDiffer((p) => p.sqft) ? 'bg-amber-50/60' : ''}>
                    <td className="p-4 font-semibold text-slate-600">Usable Floor Area</td>
                    {comparedProperties.map((p) => (
                      <td key={`sqft-${p.id}`} className="p-4 border-l border-slate-200 font-mono font-medium">
                        {p.sqft.toLocaleString()} sq ft
                      </td>
                    ))}
                    {comparedProperties.length < 3 && <td className="p-4 border-l border-slate-200 bg-slate-50/20" />}
                  </tr>

                  {/* SECTION 3: SPATIAL & NEIGHBORHOOD */}
                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <td
                      colSpan={comparedProperties.length + (comparedProperties.length < 3 ? 2 : 1)}
                      className="px-4 py-2 uppercase tracking-wider text-[11px] text-blue-900 bg-blue-50/60"
                    >
                      🛡️ Location, Safety & Walkability
                    </td>
                  </tr>

                  <tr className={highlightDifferences && valuesDiffer((p) => p.safetyScore) ? 'bg-amber-50/60' : ''}>
                    <td className="p-4 font-semibold text-slate-600">Safety Index</td>
                    {comparedProperties.map((p) => (
                      <td key={`safety-${p.id}`} className="p-4 border-l border-slate-200">
                        <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                          <span>🛡️</span>
                          <span>{p.safetyScore || 9.0} / 10</span>
                        </span>
                      </td>
                    ))}
                    {comparedProperties.length < 3 && <td className="p-4 border-l border-slate-200 bg-slate-50/20" />}
                  </tr>

                  <tr className={highlightDifferences && valuesDiffer((p) => p.walkScore) ? 'bg-amber-50/60' : ''}>
                    <td className="p-4 font-semibold text-slate-600">Walk Score</td>
                    {comparedProperties.map((p) => (
                      <td key={`walk-${p.id}`} className="p-4 border-l border-slate-200 font-mono font-bold text-slate-900">
                        {p.walkScore || 92} / 100
                      </td>
                    ))}
                    {comparedProperties.length < 3 && <td className="p-4 border-l border-slate-200 bg-slate-50/20" />}
                  </tr>

                  <tr className={highlightDifferences && valuesDiffer((p) => p.rooms3D?.length) ? 'bg-amber-50/60' : ''}>
                    <td className="p-4 font-semibold text-slate-600">3D Interactive Rooms</td>
                    {comparedProperties.map((p) => (
                      <td key={`rooms3d-${p.id}`} className="p-4 border-l border-slate-200">
                        <div className="flex flex-wrap gap-1">
                          {p.rooms3D?.map((room) => (
                            <span key={room} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                              {room}
                            </span>
                          ))}
                        </div>
                      </td>
                    ))}
                    {comparedProperties.length < 3 && <td className="p-4 border-l border-slate-200 bg-slate-50/20" />}
                  </tr>

                  {/* SECTION 4: AMENITIES MATRIX */}
                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <td
                      colSpan={comparedProperties.length + (comparedProperties.length < 3 ? 2 : 1)}
                      className="px-4 py-2 uppercase tracking-wider text-[11px] text-blue-900 bg-blue-50/60"
                    >
                      ✨ Amenities & Facilities Matrix
                    </td>
                  </tr>

                  {allAmenities.map((amenity) => {
                    const hasDifference = valuesDiffer((p) => p.amenities?.includes(amenity));
                    return (
                      <tr
                        key={`amenity-${amenity}`}
                        className={highlightDifferences && hasDifference ? 'bg-amber-50/60' : ''}
                      >
                        <td className="p-3.5 font-medium text-slate-700">{amenity}</td>
                        {comparedProperties.map((p) => {
                          const hasIt = p.amenities?.includes(amenity);
                          return (
                            <td key={`amenity-${amenity}-${p.id}`} className="p-3.5 border-l border-slate-200 text-center">
                              {hasIt ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                                  <Minus className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </td>
                          );
                        })}
                        {comparedProperties.length < 3 && <td className="p-3.5 border-l border-slate-200 bg-slate-50/20" />}
                      </tr>
                    );
                  })}

                  {/* SECTION 5: ACTION ROW */}
                  <tr className="bg-slate-50 border-t-2 border-slate-300">
                    <td className="p-4 font-bold text-slate-900">Broker Actions</td>
                    {comparedProperties.map((p) => (
                      <td key={`actions-${p.id}`} className="p-4 border-l border-slate-200">
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectPropertyFor3D) onSelectPropertyFor3D(p);
                                onClose();
                              }}
                              title="Launch 3D Virtual Tour"
                              className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-center transition-colors flex items-center justify-center cursor-pointer"
                            >
                              <Box className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectPropertyForMap) onSelectPropertyForMap(p);
                                onClose();
                              }}
                              title="Inspect on Google Maps"
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-center transition-colors flex items-center justify-center cursor-pointer"
                            >
                              <MapPin className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onSelectPropertyForAgreement(p);
                                onClose();
                              }}
                              title="Draft Legal Contract"
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-center transition-colors flex items-center justify-center cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              onAskBrokerAboutProperty(p);
                              onClose();
                            }}
                            className="w-full text-center text-[11px] text-blue-700 hover:text-blue-900 font-semibold py-1 transition-colors cursor-pointer"
                          >
                            Ask Broker AI about {p.id} →
                          </button>
                        </div>
                      </td>
                    ))}
                    {comparedProperties.length < 3 && <td className="p-4 border-l border-slate-200 bg-slate-50/20" />}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
