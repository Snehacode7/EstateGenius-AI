import React, { useState, useEffect, useId } from 'react';
import { PayPalTransaction, CompletedTransaction } from '../types';
import {
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Lock,
  ArrowRight,
  Printer,
  X,
  Building2,
  QrCode,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Wallet,
  ExternalLink,
} from 'lucide-react';
import QRCode from 'qrcode';

interface PayPalModalProps {
  transaction: PayPalTransaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (completed: CompletedTransaction) => void;
}

type TabMode = 'form' | 'qr_code';
type PaymentMethod = 'paypal_wallet' | 'qr_scan' | 'card' | 'pay_later';
type QrProtocol = 'paypal' | 'mobile_bank' | 'upi';

export const PayPalModal: React.FC<PayPalModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !transaction) return null;

  const [activeTab, setActiveTab] = useState<TabMode>('form');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal_wallet');
  const [qrProtocol, setQrProtocol] = useState<QrProtocol>('paypal');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes escrow expiry
  const [payerName, setPayerName] = useState('Alexander Wright');
  const [payerEmail, setPayerEmail] = useState('alex.wright@estateclient.com');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardExp, setCardExp] = useState('08/28');
  const [cardCvc, setCardCvc] = useState('921');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedData, setCompletedData] = useState<CompletedTransaction | null>(null);

  const referenceSuffix = useId().replace(/:/g, '').slice(0, 6).toUpperCase() || 'REF101';
  const escrowRefCode = `ESCROW-${transaction.property_id.replace('-', '')}-${referenceSuffix}`;

  const amountNum = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount;
  const formattedAmount = isNaN(amountNum)
    ? '0.00'
    : amountNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const currency = transaction.currency || 'USD';
  const isEmi = transaction.payment_category === 'EMI_INSTALLMENT';

  // Format payment URI for QR Code based on active protocol
  const getPaymentUri = () => {
    const desc = encodeURIComponent(`${transaction.property_id} ${transaction.payment_category || 'Deposit'}`);
    switch (qrProtocol) {
      case 'paypal':
        return `https://www.paypal.com/qrcodes/managed/pay?recipient=escrow%40estatemind.ai&amount=${amountNum}&currency=${currency}&ref=${escrowRefCode}&desc=${desc}`;
      case 'upi':
        return `upi://pay?pa=escrow.estatemind@icici&pn=EstateMind%20Escrow&am=${amountNum}&cu=${currency}&tn=${escrowRefCode}`;
      case 'mobile_bank':
      default:
        // Universal Banking EPC/SEPA/Mobile Web standard URI
        return `https://pay.estatemind.ai/v1/escrow/checkout?ref=${escrowRefCode}&prop=${transaction.property_id}&amt=${amountNum}&cur=${currency}&method=mobile_bank`;
    }
  };

  const paymentUri = getPaymentUri();

  // Generate QR Code data URL dynamically
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(paymentUri, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#002661', // Deep PayPal navy
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.warn('QR code generation note:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [paymentUri, qrProtocol]);

  // Countdown timer for QR escrow validity
  useEffect(() => {
    if (activeTab !== 'qr_code' && paymentMethod !== 'qr_scan') return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 600; // Reset
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTab, paymentMethod]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentUri);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExecutePayment = (viaQr = false) => {
    setIsProcessing(true);
    setTimeout(() => {
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const mockPayId = `PAYID-${transaction.property_id.replace('-', '')}-${randomSuffix}`;

      let methodLabel = 'PayPal Balance / Instant Transfer';
      if (viaQr || activeTab === 'qr_code' || paymentMethod === 'qr_scan') {
        methodLabel = `Mobile Banking QR Code (${qrProtocol === 'paypal' ? 'PayPal App' : qrProtocol === 'upi' ? 'UPI Instant Pay' : 'Mobile Banking Scanner'})`;
      } else if (paymentMethod === 'card') {
        methodLabel = 'Debit/Credit Card via PayPal';
      } else if (paymentMethod === 'pay_later') {
        methodLabel = 'PayPal Pay in 4 / Monthly Installments';
      }

      const record: CompletedTransaction = {
        transactionId: mockPayId,
        date: new Date().toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        propertyId: transaction.property_id,
        propertyTitle: transaction.property_title || transaction.property_id,
        amount: amountNum,
        currency,
        category: transaction.payment_category || 'RENTAL_DEPOSIT',
        paymentMethod: methodLabel,
        payerName: viaQr || paymentMethod === 'qr_scan' ? 'Mobile App Verified Payer' : payerName,
        payerEmail: viaQr || paymentMethod === 'qr_scan' ? 'mobile.bank.auth@verified.estate' : payerEmail,
        status: 'COMPLETED',
      };

      setIsProcessing(false);
      setCompletedData(record);
      onSuccess(record);
    }, 1800);
  };

  const handleClose = () => {
    setCompletedData(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* PayPal Top Header */}
        <div className="bg-[#003087] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/10 p-1.5 rounded-lg flex items-center justify-center">
              <span className="font-extrabold tracking-tighter text-xl italic font-serif text-white">
                <span className="text-[#0079C1]">Pay</span>
                <span className="text-[#00457C]">Pal</span>
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wider uppercase text-blue-200">
                Verified Broker Escrow
              </div>
              <div className="text-sm font-medium text-white/90">EstateMind AI Secure Gateway</div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close PayPal Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs (Form vs QR Code) */}
        {!completedData && (
          <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('form');
                if (paymentMethod === 'qr_scan') setPaymentMethod('paypal_wallet');
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 -mb-[1px] ${
                activeTab === 'form'
                  ? 'bg-white text-blue-700 border-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Checkout Options</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('qr_code');
                setPaymentMethod('qr_scan');
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 -mb-[1px] ${
                activeTab === 'qr_code'
                  ? 'bg-white text-blue-700 border-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              <span>Scan & Pay via Mobile Banking</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-semibold uppercase">
                Instant
              </span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {completedData ? (
            /* Success State */
            <div className="space-y-6 text-center py-2 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Payment Confirmed!</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Your transaction has been securely processed and logged in the property escrow ledger.
                </p>
              </div>

              {/* Receipt Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs uppercase font-semibold text-slate-400">Transaction ID</span>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {completedData.transactionId}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Property</span>
                  <span className="font-semibold text-slate-800 text-right">{completedData.propertyTitle}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Property ID</span>
                  <span className="font-mono text-slate-700">{completedData.propertyId}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Type</span>
                  <span className="text-slate-800 font-medium">
                    {completedData.category === 'RENTAL_DEPOSIT'
                      ? 'Booking / Token Deposit'
                      : completedData.category === 'EMI_INSTALLMENT'
                      ? 'Monthly EMI Installment'
                      : 'Rent Payment'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Payer</span>
                  <span className="text-slate-800">{completedData.payerName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Payment Channel</span>
                  <span className="text-slate-800 font-medium flex items-center gap-1.5">
                    {completedData.paymentMethod.includes('QR Code') ? (
                      <QrCode className="w-3.5 h-3.5 text-blue-600 inline" />
                    ) : (
                      <Wallet className="w-3.5 h-3.5 text-blue-600 inline" />
                    )}
                    {completedData.paymentMethod}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900">Total Charged</span>
                  <span className="font-mono text-lg font-extrabold text-emerald-600">
                    ${completedData.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                    {completedData.currency}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Protected by PayPal Buyer Escrow & EstateMind AI Broker Protocol</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : activeTab === 'qr_code' ? (
            /* QR Code Scanner View */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Summary Bar */}
              <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl">
                <div>
                  <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
                    {transaction.property_id} · {transaction.property_title}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {isEmi ? 'Monthly Installment' : 'Token Deposit'} Escrow
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xl font-extrabold text-[#003087]">
                    ${formattedAmount} <span className="text-xs font-bold">{currency}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Valid: <strong className="font-mono text-slate-700">{formattedTime}</strong></span>
                  </div>
                </div>
              </div>

              {/* Protocol Selector Tabs */}
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setQrProtocol('paypal')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-semibold text-center transition-all ${
                    qrProtocol === 'paypal'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PayPal App
                </button>
                <button
                  type="button"
                  onClick={() => setQrProtocol('mobile_bank')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-semibold text-center transition-all ${
                    qrProtocol === 'mobile_bank'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mobile Banking
                </button>
                <button
                  type="button"
                  onClick={() => setQrProtocol('upi')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-semibold text-center transition-all ${
                    qrProtocol === 'upi'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  UPI / Instant
                </button>
              </div>

              {/* QR Code Container with Stylized Viewfinder Corners */}
              <div className="relative mx-auto w-64 p-4 bg-white border border-slate-200 rounded-2xl shadow-md flex flex-col items-center">
                {/* Viewfinder Decorative Accents */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-600 rounded-tl-sm pointer-events-none" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-600 rounded-tr-sm pointer-events-none" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-600 rounded-bl-sm pointer-events-none" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-600 rounded-br-sm pointer-events-none" />

                {qrDataUrl ? (
                  <div className="relative group">
                    <img
                      src={qrDataUrl}
                      alt="Scan to pay QR Code"
                      className="w-56 h-56 object-contain rounded-lg"
                    />
                    {/* Center Brand Badge */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 bg-white rounded-full p-1 shadow-md border border-slate-200 flex items-center justify-center">
                        <span className="font-extrabold italic text-sm text-[#003087]">P</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center bg-slate-50 rounded-lg">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Animated Scanner Pulse Line */}
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Awaiting mobile bank scan...</span>
                </div>
              </div>

              {/* Supported Banking Apps Banner */}
              <div className="space-y-1.5 text-center">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Works with all major mobile banking applications
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-700 font-medium">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">PayPal</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">Chase</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">Bank of America</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">Revolut</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">Venmo</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">Wells Fargo</span>
                </div>
              </div>

              {/* Reference & Copy Actions */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Escrow Ref Code</div>
                  <div className="font-mono font-bold text-slate-800">{escrowRefCode}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSecondsLeft(600)}
                    title="Refresh QR session"
                    className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Instant Simulator Action */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleExecutePayment(true)}
                  className="w-full relative group overflow-hidden bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 px-5 rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Mobile Bank Authorization...</span>
                    </div>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      <span>Simulate Mobile Scan & Confirm (${formattedAmount} USD)</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-500">
                  Scanning from your phone will automatically confirm and trigger the digital escrow receipt.
                </p>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <>
              {/* Property & Price Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
                      <Building2 className="w-3.5 h-3.5" />
                      {transaction.property_id} · {isEmi ? 'Purchase Installment' : 'Token Deposit'}
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">
                      {transaction.property_title}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-2xl font-extrabold text-slate-900">
                      ${formattedAmount}
                    </div>
                    <div className="text-xs text-slate-500">
                      {isEmi ? 'Monthly Installment' : 'Direct Booking Deposit'}
                    </div>
                  </div>
                </div>

                {transaction.details && (
                  <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/60">
                    {transaction.details}
                  </p>
                )}

                {isEmi && transaction.tenure_months && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500">Tenure:</span>{' '}
                      <span className="font-medium text-slate-800">
                        {transaction.tenure_months} Months ({Math.round(transaction.tenure_months / 12)} Yrs)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Downpayment:</span>{' '}
                      <span className="font-medium text-slate-800">
                        ${transaction.downpayment ? Number(transaction.downpayment).toLocaleString() : '20,000'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Select PayPal Payment Option
                </label>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Option: QR Scan to Pay */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('qr_scan');
                      setActiveTab('qr_code');
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                      paymentMethod === 'qr_scan'
                        ? 'border-[#0079C1] bg-blue-50/50 shadow-xs ring-1 ring-[#0079C1]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border flex items-center justify-center border-slate-300">
                        {paymentMethod === 'qr_scan' && (
                          <div className="w-2.5 h-2.5 bg-[#0079C1] rounded-full" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-blue-600" />
                          <span>QR Code (Scan & Pay with Mobile Banking)</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Scan with PayPal, Chase, Revolut, Venmo, or any banking app
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600 text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Mobile Scan
                    </span>
                  </button>

                  {/* Option: PayPal Wallet */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal_wallet')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                      paymentMethod === 'paypal_wallet'
                        ? 'border-[#0079C1] bg-blue-50/50 shadow-xs ring-1 ring-[#0079C1]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border flex items-center justify-center border-slate-300">
                        {paymentMethod === 'paypal_wallet' && (
                          <div className="w-2.5 h-2.5 bg-[#0079C1] rounded-full" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          PayPal Balance / Connected Bank
                        </div>
                        <div className="text-xs text-slate-500">
                          One-click instant payment via registered account
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-[#0079C1] text-xs">Recommended</span>
                  </button>

                  {/* Option: Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                      paymentMethod === 'card'
                        ? 'border-[#0079C1] bg-blue-50/50 shadow-xs ring-1 ring-[#0079C1]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border flex items-center justify-center border-slate-300">
                        {paymentMethod === 'card' && (
                          <div className="w-2.5 h-2.5 bg-[#0079C1] rounded-full" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-slate-600" />
                          Debit or Credit Card via PayPal
                        </div>
                        <div className="text-xs text-slate-500">
                          Visa, Mastercard, Amex, Discover accepted
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Option: Pay Later */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pay_later')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                      paymentMethod === 'pay_later'
                        ? 'border-[#0079C1] bg-blue-50/50 shadow-xs ring-1 ring-[#0079C1]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border flex items-center justify-center border-slate-300">
                        {paymentMethod === 'pay_later' && (
                          <div className="w-2.5 h-2.5 bg-[#0079C1] rounded-full" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          PayPal Pay Later & Installments
                        </div>
                        <div className="text-xs text-slate-500">
                          Flexible monthly installments & subscription authorization
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      0% Promo
                    </span>
                  </button>
                </div>
              </div>

              {/* Payer Details */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Payer Full Name</label>
                    <input
                      type="text"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">PayPal Email</label>
                    <input
                      type="email"
                      value={payerEmail}
                      onChange={(e) => setPayerEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-2 pt-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full text-xs px-3 py-2 font-mono border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Expires</label>
                        <input
                          type="text"
                          value={cardExp}
                          onChange={(e) => setCardExp(e.target.value)}
                          className="w-full text-xs px-3 py-2 font-mono border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">CVV</label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full text-xs px-3 py-2 font-mono border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PayPal Primary Checkout CTA */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleExecutePayment(false)}
                  className="w-full relative group overflow-hidden bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-bold text-base py-3.5 px-6 rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
                      <span>Authorizing PayPal Escrow...</span>
                    </div>
                  ) : (
                    <>
                      <span className="italic font-serif text-lg tracking-tight">
                        Pay<span className="text-[#0079C1]">Pal</span>
                      </span>
                      <span>Checkout · ${formattedAmount} USD</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>256-Bit SSL Encrypted Broker Escrow · Instant Confirmation</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
