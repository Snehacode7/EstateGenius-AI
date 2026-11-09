export interface TrendDataPoint {
  date: string; // YYYY-MM
  label: string;
  rent: number;
  price: number;
  pricePerSqft: number;
  occupancyRate: number;
}

export interface LocationMarketProfile {
  location: string;
  propertyId: string;
  propertyTitle: string;
  category: string;
  currentRent: number;
  currentPrice: number;
  yoyGrowth: string;
  avgDaysOnMarket: number;
  absorptionRate: string;
  history: TrendDataPoint[];
}

export const MARKET_TRENDS_BY_LOCATION: Record<string, LocationMarketProfile> = {
  Downtown: {
    location: 'Downtown',
    propertyId: 'PROP-101',
    propertyTitle: 'Downtown Luxury 2-BHK',
    category: '2-BHK Luxury',
    currentRent: 1200,
    currentPrice: 135000,
    yoyGrowth: '+14.3%',
    avgDaysOnMarket: 9,
    absorptionRate: '97.2%',
    history: [
      { date: '2025-12', label: 'Dec 25', rent: 1050, price: 118000, pricePerSqft: 94, occupancyRate: 93 },
      { date: '2026-01', label: 'Jan 26', rent: 1065, price: 120000, pricePerSqft: 96, occupancyRate: 94 },
      { date: '2026-02', label: 'Feb 26', rent: 1080, price: 121500, pricePerSqft: 97, occupancyRate: 94 },
      { date: '2026-03', label: 'Mar 26', rent: 1100, price: 123000, pricePerSqft: 98, occupancyRate: 95 },
      { date: '2026-04', label: 'Apr 26', rent: 1120, price: 125000, pricePerSqft: 100, occupancyRate: 95 },
      { date: '2026-05', label: 'May 26', rent: 1135, price: 127000, pricePerSqft: 102, occupancyRate: 96 },
      { date: '2026-06', label: 'Jun 26', rent: 1150, price: 128500, pricePerSqft: 103, occupancyRate: 96 },
      { date: '2026-07', label: 'Jul 26', rent: 1165, price: 130000, pricePerSqft: 104, occupancyRate: 96 },
      { date: '2026-08', label: 'Aug 26', rent: 1175, price: 131500, pricePerSqft: 105, occupancyRate: 97 },
      { date: '2026-09', label: 'Sep 26', rent: 1185, price: 133000, pricePerSqft: 106, occupancyRate: 97 },
      { date: '2026-10', label: 'Oct 26', rent: 1195, price: 134200, pricePerSqft: 107, occupancyRate: 97 },
      { date: '2026-11', label: 'Nov 26', rent: 1200, price: 135000, pricePerSqft: 108, occupancyRate: 97 },
    ],
  },
  Heights: {
    location: 'Heights',
    propertyId: 'PROP-102',
    propertyTitle: 'Modern Suburban Villa',
    category: 'Suburban Villa',
    currentRent: 2400,
    currentPrice: 120000,
    yoyGrowth: '+11.1%',
    avgDaysOnMarket: 14,
    absorptionRate: '95.4%',
    history: [
      { date: '2025-12', label: 'Dec 25', rent: 2150, price: 108000, pricePerSqft: 32, occupancyRate: 91 },
      { date: '2026-01', label: 'Jan 26', rent: 2180, price: 109500, pricePerSqft: 32, occupancyRate: 92 },
      { date: '2026-02', label: 'Feb 26', rent: 2200, price: 111000, pricePerSqft: 33, occupancyRate: 92 },
      { date: '2026-03', label: 'Mar 26', rent: 2240, price: 112500, pricePerSqft: 33, occupancyRate: 93 },
      { date: '2026-04', label: 'Apr 26', rent: 2270, price: 114000, pricePerSqft: 34, occupancyRate: 93 },
      { date: '2026-05', label: 'May 26', rent: 2300, price: 115500, pricePerSqft: 34, occupancyRate: 94 },
      { date: '2026-06', label: 'Jun 26', rent: 2320, price: 116500, pricePerSqft: 34, occupancyRate: 94 },
      { date: '2026-07', label: 'Jul 26', rent: 2340, price: 117500, pricePerSqft: 35, occupancyRate: 95 },
      { date: '2026-08', label: 'Aug 26', rent: 2360, price: 118200, pricePerSqft: 35, occupancyRate: 95 },
      { date: '2026-09', label: 'Sep 26', rent: 2380, price: 119000, pricePerSqft: 35, occupancyRate: 95 },
      { date: '2026-10', label: 'Oct 26', rent: 2390, price: 119600, pricePerSqft: 35, occupancyRate: 95 },
      { date: '2026-11', label: 'Nov 26', rent: 2400, price: 120000, pricePerSqft: 35, occupancyRate: 95 },
    ],
  },
  'Tech Park': {
    location: 'Tech Park',
    propertyId: 'PROP-103',
    propertyTitle: 'Commercial Studio Space',
    category: 'Commercial Loft',
    currentRent: 850,
    currentPrice: 98000,
    yoyGrowth: '+18.1%',
    avgDaysOnMarket: 7,
    absorptionRate: '98.5%',
    history: [
      { date: '2025-12', label: 'Dec 25', rent: 720, price: 83000, pricePerSqft: 85, occupancyRate: 94 },
      { date: '2026-01', label: 'Jan 26', rent: 735, price: 84500, pricePerSqft: 86, occupancyRate: 95 },
      { date: '2026-02', label: 'Feb 26', rent: 750, price: 86000, pricePerSqft: 88, occupancyRate: 95 },
      { date: '2026-03', label: 'Mar 26', rent: 765, price: 88000, pricePerSqft: 90, occupancyRate: 96 },
      { date: '2026-04', label: 'Apr 26', rent: 780, price: 90000, pricePerSqft: 92, occupancyRate: 96 },
      { date: '2026-05', label: 'May 26', rent: 800, price: 92000, pricePerSqft: 94, occupancyRate: 97 },
      { date: '2026-06', label: 'Jun 26', rent: 815, price: 93500, pricePerSqft: 95, occupancyRate: 97 },
      { date: '2026-07', label: 'Jul 26', rent: 825, price: 95000, pricePerSqft: 97, occupancyRate: 98 },
      { date: '2026-08', label: 'Aug 26', rent: 835, price: 96000, pricePerSqft: 98, occupancyRate: 98 },
      { date: '2026-09', label: 'Sep 26', rent: 840, price: 97000, pricePerSqft: 99, occupancyRate: 98 },
      { date: '2026-10', label: 'Oct 26', rent: 845, price: 97500, pricePerSqft: 99, occupancyRate: 98 },
      { date: '2026-11', label: 'Nov 26', rent: 850, price: 98000, pricePerSqft: 100, occupancyRate: 98 },
    ],
  },
};
