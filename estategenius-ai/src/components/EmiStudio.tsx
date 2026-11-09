import React, { useState, useMemo } from 'react';
import { Property, PayPalTransaction } from '../types';
import { calculateEmi, generateAmortizationSchedule } from '../utils/emiCalculator';
import { Calculator, ArrowRight, ShieldCheck, DollarSign, Calendar, Percent, Building2, HelpCircle } from 'lucide-react';

interface EmiStudioProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property) => void;
  onTriggerPayPal: (tx: PayPalTransaction) => void;
}

export const EmiStudio: React.FC<EmiStudioProps> = ({
  properties,
  selectedProperty,
  onSelectProperty,
  onTriggerPayPal,
}) => {
  // Find default sale property (PROP-102)
  const defaultSaleProp = properties.find((p) => p.type === 'Sale') || properties[1] || properties[0];
  const activeProp = selectedProperty?.type === 'Sale' ? selectedProperty : defaultSaleProp;

  const [price, setPrice] = useState<number>(activeProp?.price || 120000);
  const [downpayment, setDownpayment] = useState<number>(activeProp?.minDownpayment || 20000);
  const [tenureMonths, setTenureMonths] = useState<number>(60);
  const [interestRate, setInterestRate] = useState<number>(5.5);

  // Update when activeProp changes
  React.useEffect(() => {
    if (activeProp?.price) {
      setPrice(activeProp.price);
      setDownpayment(activeProp.minDownpayment || Math.round(activeProp.price * 0.15));
    }
  }, [activeProp]);

  const emiData = useMemo(() => {
    return calculateEmi(price, downpayment, interestRate, tenureMonths);
  }, [price, downpayment, interestRate, tenureMonths]);

  const schedule = useMemo(() => {
    return generateAmortizationSchedule(emiData.loanAmount, interestRate, tenureMonths, emiData.monthlyEmi);
  }, [emiData, interestRate, tenureMonths]);

  const downpaymentPercent = price > 0 ? Math.round((downpayment / price) * 100) : 0;
  const principalPercent = emiData.totalAmountPayable > 0 ? Math.round((price / emiData.totalAmountPayable) * 100) : 100;
  const interestPercent = 100 - principalPercent;

  const handleLaunchPayPalEmi = () => {
    const tx: PayPalTransaction = {
      action: 'INITIATE_PAYPAL_PAYMENT',
      payment_category: 'EMI_INSTALLMENT',
      property_id: activeProp?.id || 'PROP-102',
      property_title: activeProp?.title || 'Modern Suburban Villa',
      amount: emiData.monthlyEmi.toFixed(2),
      currency: 'USD',
      downpayment: downpayment.toString(),
      tenure_months: tenureMonths,
      monthly_emi: emiData.monthlyEmi.toFixed(2),
      details: `First month EMI installment under PayPal ${tenureMonths}-month subscription plan`,
    };
    onTriggerPayPal(tx);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-blue-900" />
            Property Purchase EMI & Financial Structuring Studio
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Simulate mortgage & developer installments, customize downpayments, and configure monthly PayPal Subscriptions.
          </p>
        </div>

        {/* Selected Property Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Select Property:</label>
          <select
            value={activeProp?.id}
            onChange={(e) => {
              const found = properties.find((p) => p.id === e.target.value);
              if (found) onSelectProperty(found);
            }}
            className="text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-2xs focus:ring-1 focus:ring-blue-600"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} - {p.title} ({p.type === 'Sale' ? `$${p.price?.toLocaleString()}` : `$${p.rent}/mo`})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Controls on left, Results on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-blue-700" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {activeProp?.title || 'Property Financing'}
                </h3>
                <span className="text-xs text-slate-500">{activeProp?.location} · Valuation: ${price.toLocaleString()}</span>
              </div>
            </div>
            <span className="font-mono-tabular text-xs font-bold bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md">
              {activeProp?.id}
            </span>
          </div>

          {/* Price Input & Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Total Purchase Price (USD)</span>
              <span className="font-mono-tabular font-bold text-slate-900">${price.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="50000"
              max="500000"
              step="5000"
              value={price}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPrice(val);
                if (downpayment > val) setDownpayment(Math.round(val * 0.15));
              }}
              className="w-full accent-blue-900 cursor-pointer"
            />
          </div>

          {/* Downpayment Input & Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Initial Downpayment ({downpaymentPercent}%)
              </span>
              <span className="font-mono-tabular font-bold text-emerald-700">${downpayment.toLocaleString()} USD</span>
            </div>
            <input
              type="range"
              min="0"
              max={price}
              step="2000"
              value={downpayment}
              onChange={(e) => setDownpayment(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex gap-2 pt-1">
              {[10, 15, 20, 25, 30].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDownpayment(Math.round(price * (pct / 100)))}
                  className={`text-[11px] font-medium px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                    downpaymentPercent === pct
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Tenure Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Financing Tenure</span>
              <span className="font-bold text-blue-900">{tenureMonths} Months ({tenureMonths / 12} Years)</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {[12, 24, 36, 48, 60, 84].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTenureMonths(m)}
                  className={`py-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                    tenureMonths === m
                      ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {m} Mo
                </button>
              ))}
            </div>
          </div>

          {/* Annual Interest Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Annual Interest Rate</span>
              <span className="font-mono-tabular font-bold text-slate-900">{interestRate}% Fixed</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="12"
                step="0.25"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="flex-1 accent-blue-900 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setInterestRate(0)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  interestRate === 0
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                0% Developer Promo
              </button>
            </div>
          </div>
        </div>

        {/* Results & PayPal Checkout Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-6">
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-blue-300">
                Calculated Monthly Installment
              </div>
              <div className="font-mono-tabular text-4xl font-extrabold text-amber-400 mt-1">
                ${emiData.monthlyEmi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-sm font-normal text-slate-300">/mo</span>
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Structured over {tenureMonths} payments with ${downpayment.toLocaleString()} upfront.
              </div>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-slate-400">Financed Loan Principal</div>
                <div className="font-mono-tabular text-base font-bold text-white mt-0.5">
                  ${emiData.loanAmount.toLocaleString()}
                </div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-slate-400">Total Interest Payable</div>
                <div className="font-mono-tabular text-base font-bold text-amber-300 mt-0.5">
                  ${emiData.totalInterest.toLocaleString()}
                </div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-slate-400">Downpayment Paid</div>
                <div className="font-mono-tabular text-base font-bold text-emerald-400 mt-0.5">
                  ${downpayment.toLocaleString()}
                </div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-slate-400">Total Outlay</div>
                <div className="font-mono-tabular text-base font-bold text-white mt-0.5">
                  ${emiData.totalAmountPayable.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Principal vs Interest Distribution Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>Principal ({principalPercent}%)</span>
                <span>Interest ({interestPercent}%)</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden flex">
                <div style={{ width: `${principalPercent}%` }} className="bg-blue-400" />
                <div style={{ width: `${interestPercent}%` }} className="bg-amber-400" />
              </div>
            </div>

            {/* PayPal EMI Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleLaunchPayPalEmi}
                className="w-full bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-bold text-base py-3.5 px-4 rounded-xl shadow-lg transition-transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="italic font-serif text-lg tracking-tight">Pay<span className="text-[#0079C1]">Pal</span></span>
                <span>Setup EMI · ${emiData.monthlyEmi.toLocaleString()}/mo</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-3">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Authorized via PayPal Subscriptions & Escrow Contract</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* First 12 Months Amortization Preview Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Amortization Schedule (First 12 Months Preview)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Month-by-month principal reduction and interest allocation.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {tenureMonths} Total Installments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3">Installment</th>
                <th className="py-2.5 px-3">Principal</th>
                <th className="py-2.5 px-3">Interest</th>
                <th className="py-2.5 px-3 text-right">Remaining Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono-tabular">
              {schedule.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">Month {row.month}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">${row.emi.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-emerald-700">${row.principal.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-amber-700">${row.interest.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-700">${row.remainingBalance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
