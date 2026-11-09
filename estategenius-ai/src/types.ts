export type PersonaType = 'client' | 'owner';

export interface PropertyImage {
  url: string;
  caption: string;
  tag?: 'Exterior' | 'Living Room' | 'Bedroom' | 'Kitchen' | 'Bathroom' | 'Balcony' | 'Courtyard' | 'Workspace' | 'Conference' | 'Amenities' | 'Floor Plan' | string;
}

export interface Property {
  id: string;
  type: 'Rent' | 'Sale';
  category: '1-BHK' | '2-BHK' | 'Villa' | 'Commercial';
  title: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  rent?: number;
  deposit?: number;
  price?: number;
  minDownpayment?: number;
  bedrooms: string;
  bathrooms: number;
  sqft: number;
  image: string;
  images?: string[];
  gallery?: PropertyImage[];
  description: string;
  amenities: string[];
  status: 'Available' | 'Deposit Paid / Reserved' | 'EMI Plan Active';
  ownerName: string;
  rooms3D: string[];
  safetyScore?: number;
  walkScore?: number;
  rentalYield?: number;
  fiveYearAppreciation?: string;
}

export interface PayPalTransaction {
  action: 'INITIATE_PAYPAL_PAYMENT';
  payment_category?: 'RENTAL_DEPOSIT' | 'EMI_INSTALLMENT' | 'FIRST_MONTH_RENT' | 'SECURITY_DEPOSIT' | 'SPLIT_RENT' | string;
  property_id: string;
  property_title?: string;
  amount: string | number;
  total_amount?: string | number;
  per_person_amount?: string | number;
  tenants_count?: number;
  currency: string;
  downpayment?: string | number;
  tenure_months?: number;
  monthly_emi?: string | number;
  details?: string;
}

export interface ThreeDAction {
  action: 'TRIGGER_3D_ANIMATION' | 'TRIGGER_3D_SCENE';
  target_room?: string;
  animation_type?: 'CAMERA_PAN_AND_ZOOM' | 'ZOOM_AND_ROTATE' | 'TOP_DOWN_FLOOR_PLAN' | 'WALKTHROUGH' | 'TOGGLE_LIGHTING' | string;
  property_id?: string;
  model_id?: string;
  lighting_preset?: 'day' | 'sunset' | 'night';
  staging_mode?: 'empty' | 'furnished';
  staging_style?: 'modern_luxury' | 'scandinavian_minimalist' | 'industrial_loft' | string;
}

export interface MapFocusAction {
  action: 'FOCUS_MAP_LOCATION' | 'TRIGGER_MAPS_LOCATION';
  property_id?: string;
  location?: string;
  location_name?: string;
  radius_km?: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface LegalContractAction {
  action: 'GENERATE_LEGAL_CONTRACT';
  contract_type: 'RENTAL_AGREEMENT' | 'PURCHASE_INTENT';
  property_id: string;
  property_title?: string;
  term_months: number;
  monthly_rent?: string | number;
  security_deposit?: string | number;
  total_price?: string | number;
  downpayment?: string | number;
  covenants?: string[];
}

export interface MaintenanceTicketAction {
  action: 'LOG_MAINTENANCE_TICKET';
  ticket_id?: string;
  property_id: string;
  property_title?: string;
  issue_type: string;
  severity: 'Low' | 'Medium' | 'High' | 'Emergency';
  estimated_cost: string | number;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  description?: string;
}

export interface MaintenanceTicket {
  id: string;
  propertyId: string;
  propertyTitle?: string;
  issueCategory: string;
  issue: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY' | string;
  severity: 'Low' | 'Medium' | 'High' | 'Emergency' | string;
  estimatedCostUsd: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  reportedDate?: string;
  reportedBy?: string;
  createdAt?: string;
}

export interface SplitRentAction {
  action: 'SPLIT_RENT_PAYMENT';
  property_id: string;
  property_title?: string;
  total_rent: string | number;
  roommates_count: number;
  per_person_amount: string | number;
  utilities_estimate?: string | number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  detectedPayment?: PayPalTransaction | null;
  detectedPayments?: PayPalTransaction[];
  detected3DAction?: ThreeDAction | null;
  detectedMapAction?: MapFocusAction | null;
  detectedContract?: LegalContractAction | null;
  detectedMaintenance?: MaintenanceTicketAction | null;
  detectedSplitRent?: SplitRentAction | null;
}

export interface EmiCalculation {
  propertyPrice: number;
  downpayment: number;
  loanAmount: number;
  interestRate: number;
  tenureMonths: number;
  monthlyEmi: number;
  totalInterest: number;
  totalAmountPayable: number;
}

export interface CompletedTransaction {
  transactionId: string;
  date: string;
  propertyId: string;
  propertyTitle: string;
  amount: number;
  currency: string;
  category: string;
  paymentMethod: string;
  payerName: string;
  payerEmail: string;
  status: 'COMPLETED';
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

export interface UserFavoriteItem {
  id: string; // composite `${userId}_${propertyId}`
  userId: string;
  userEmail: string;
  propertyId: string;
  propertyTitle: string;
  propertyType: 'Rent' | 'Sale';
  propertyCategory: string;
  location: string;
  priceDisplay: string;
  image: string;
  notes?: string;
  savedAt: string;
  updatedAt?: string;
}

