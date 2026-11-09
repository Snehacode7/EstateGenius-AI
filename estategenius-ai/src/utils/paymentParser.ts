import { PayPalTransaction, ThreeDAction, MapFocusAction, LegalContractAction, MaintenanceTicketAction, SplitRentAction } from '../types';

export function extractActionsFromText(text: string): {
  cleanText: string;
  transaction: PayPalTransaction | null;
  transactions: PayPalTransaction[];
  threeDAction: ThreeDAction | null;
  mapAction: MapFocusAction | null;
  contractAction: LegalContractAction | null;
  maintenanceAction: MaintenanceTicketAction | null;
  splitRentAction: SplitRentAction | null;
} {
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
  let match;
  let detectedTransaction: PayPalTransaction | null = null;
  const allTransactions: PayPalTransaction[] = [];
  let detected3D: ThreeDAction | null = null;
  let detectedMap: MapFocusAction | null = null;
  let detectedContract: LegalContractAction | null = null;
  let detectedMaintenance: MaintenanceTicketAction | null = null;
  let detectedSplitRent: SplitRentAction | null = null;

  const processObject = (parsed: any) => {
    if (!parsed || typeof parsed !== 'object') return;
    const action = parsed.action;

    if (action === 'INITIATE_PAYPAL_PAYMENT') {
      const tx = parsed as PayPalTransaction;
      if (!tx.amount) {
        tx.amount = tx.per_person_amount || tx.total_amount || '200.00';
      }
      if (!tx.property_title) {
        tx.property_title = tx.property_id === 'PROP-101' ? 'Downtown Luxury 2-BHK' : tx.property_id === 'PROP-102' ? 'Modern Suburban Villa' : 'Commercial Studio Space';
      }
      allTransactions.push(tx);
      if (!detectedTransaction) {
        detectedTransaction = tx;
      }
      if (tx.payment_category === 'SPLIT_RENT' && !detectedSplitRent) {
        detectedSplitRent = {
          action: 'SPLIT_RENT_PAYMENT',
          property_id: tx.property_id || 'PROP-101',
          property_title: tx.property_title,
          total_rent: tx.total_amount || '1200.00',
          roommates_count: tx.tenants_count || 3,
          per_person_amount: tx.per_person_amount || tx.amount || '400.00',
        };
      }
    } else if (action === 'TRIGGER_3D_ANIMATION' || action === 'TRIGGER_3D_SCENE') {
      const action3D = parsed as ThreeDAction;
      if (!action3D.model_id && action3D.property_id) action3D.model_id = action3D.property_id;
      if (!action3D.property_id && action3D.model_id) action3D.property_id = action3D.model_id;
      if (!detected3D) detected3D = action3D;
    } else if (action === 'FOCUS_MAP_LOCATION' || action === 'TRIGGER_MAPS_LOCATION') {
      const mapAct = parsed as MapFocusAction;
      if (!mapAct.property_id) mapAct.property_id = 'PROP-101';
      if (!mapAct.location) mapAct.location = mapAct.location_name || 'Downtown City Center';
      if (!mapAct.coordinates) {
        mapAct.coordinates = { lat: 40.7128, lng: -74.0060 };
      }
      if (!detectedMap) detectedMap = mapAct;
    } else if (action === 'GENERATE_LEGAL_CONTRACT' && !detectedContract) {
      detectedContract = parsed as LegalContractAction;
    } else if (action === 'LOG_MAINTENANCE_TICKET' && !detectedMaintenance) {
      detectedMaintenance = parsed as MaintenanceTicketAction;
    } else if (action === 'SPLIT_RENT_PAYMENT' && !detectedSplitRent) {
      detectedSplitRent = parsed as SplitRentAction;
    }
  };

  while ((match = codeBlockRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      processObject(parsed);
    } catch {
      // ignore
    }
  }

  // Also check raw json objects if backticks were omitted
  const rawMatches = text.match(/\{[\s\S]*?\}/g);
  if (rawMatches) {
    for (const m of rawMatches) {
      try {
        const parsed = JSON.parse(m);
        processObject(parsed);
      } catch {
        // ignore
      }
    }
  }

  return {
    cleanText: text,
    transaction: detectedTransaction,
    transactions: allTransactions,
    threeDAction: detected3D,
    mapAction: detectedMap,
    contractAction: detectedContract,
    maintenanceAction: detectedMaintenance,
    splitRentAction: detectedSplitRent,
  };
}

// Retain backward-compatible helper
export function extractPayPalTransaction(text: string) {
  const res = extractActionsFromText(text);
  return {
    cleanText: res.cleanText,
    transaction: res.transaction,
  };
}
