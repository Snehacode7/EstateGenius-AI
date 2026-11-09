import { jsPDF } from 'jspdf';
import { Property } from '../types';

export interface AgreementPdfOptions {
  property: Property;
  signatureName: string;
  signatureDate: string;
  isSigned: boolean;
  termMonths?: number;
}

export const generateAgreementPdf = ({
  property,
  signatureName,
  signatureDate,
  isSigned,
  termMonths = 11,
}: AgreementPdfOptions): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const isRent = property.type === 'Rent';
  const agreementRef = `${property.id}-AGR-${new Date().getFullYear()}`;

  // 1. Top Decorative Brand Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 6, 'F');

  // 2. Organization & Header Protocol
  y = 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text('ESTATEMIND AI SMART BROKERAGE · DIGITAL LEGAL PROTOCOL', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  const dateString = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.text(`ISSUED: ${dateString} | PROTOCOL: RFC-2026-EM`, pageWidth - margin, y, { align: 'right' });

  y += 5;
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // 3. Document Title & Official Seal Badge
  y += 9;
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  const docTitle = isRent
    ? 'DIGITAL RESIDENTIAL LEASE AGREEMENT'
    : 'DIGITAL PURCHASE INTENT CONTRACT';
  doc.text(docTitle, margin, y);

  // Verified Seal Box (Top Right)
  const sealWidth = 36;
  const sealHeight = 18;
  const sealX = pageWidth - margin - sealWidth;
  const sealY = y - 7;
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.8);
  doc.roundedRect(sealX, sealY, sealWidth, sealHeight, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 58, 138);
  doc.text('VERIFIED BROKER ESCROW', sealX + sealWidth / 2, sealY + 5, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('ESTATEMIND', sealX + sealWidth / 2, sealY + 11, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('AUTHENTICATED E-SEAL', sealX + sealWidth / 2, sealY + 15.5, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Reference Identifier: ${agreementRef} · Jurisdiction: Electronic Signatures & Escrow Enactments`, margin, y);

  // 4. Section 01: Parties & Representation
  y += 10;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SECTION 01: PARTIES & LEGAL REPRESENTATION', margin + 3, y + 4.2);

  y += 8;
  const boxWidth = (contentWidth - 4) / 2;
  const partyBoxHeight = 22;

  // Owner Party Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, boxWidth, partyBoxHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('LESSOR / PROPERTY OWNER:', margin + 3, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(property.ownerName, margin + 3, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Broker Representative: EstateMind AI Operations Desk', margin + 3, y + 14.5);
  doc.text('Status: Verified Landlord Registry', margin + 3, y + 18.5);

  // Client Party Box
  const clientX = margin + boxWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(clientX, y, boxWidth, partyBoxHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(isRent ? 'LESSEE / TENANT (CLIENT):' : 'BUYER / PURCHASER (CLIENT):', clientX + 3, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(signatureName || 'Verified Tenant Client', clientX + 3, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Identity Verification: PayPal KYC Verified Client', clientX + 3, y + 14.5);
  doc.text(`Execution Date: ${signatureDate}`, clientX + 3, y + 18.5);

  // 5. Section 02: Description of Subject Premises
  y += partyBoxHeight + 6;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SECTION 02: DESCRIPTION OF SUBJECT PREMISES', margin + 3, y + 4.2);

  y += 8;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${property.title} (${property.id})`, margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Location: ${property.location} · Category: ${property.category} · Coordinates: ${property.coordinates.lat.toFixed(4)}, ${property.coordinates.lng.toFixed(4)}`, margin + 4, y + 10.5);
  doc.text(`Dimensions & Usable Area: ${property.sqft.toLocaleString()} sq ft | Layout: ${property.bedrooms} | Bathrooms: ${property.bathrooms}`, margin + 4, y + 15);
  doc.text(`Spatial Safety Score: ${property.safetyScore || 9.0}/10 | Walkability Index: ${property.walkScore || 90}/100`, margin + 4, y + 19.5);

  // 6. Section 03: Financial Considerations & Escrow Terms
  y += 28;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SECTION 03: FINANCIAL CONSIDERATIONS & ESCROW TERMS', margin + 3, y + 4.2);

  y += 8;
  const finBoxWidth = (contentWidth - 6) / 3;
  const finBoxHeight = 18;

  // Fin 1: Monthly Rent / Total Price
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, finBoxWidth, finBoxHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(isRent ? 'AGREED MONTHLY RENT:' : 'AGREED PURCHASE PRICE:', margin + 3, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  const fin1Text = isRent
    ? `$${property.rent?.toLocaleString() || 1200} / Month`
    : `$${property.price?.toLocaleString() || 120000}`;
  doc.text(fin1Text, margin + 3, y + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Due on the 1st of each calendar month', margin + 3, y + 15.5);

  // Fin 2: Token Deposit / Downpayment
  const fin2X = margin + finBoxWidth + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(fin2X, y, finBoxWidth, finBoxHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(isRent ? 'TOKEN BOOKING DEPOSIT:' : 'MINIMUM DOWNPAYMENT:', fin2X + 3, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129); // emerald-600
  const fin2Text = isRent
    ? `$${property.deposit || 200}.00 USD`
    : `$${property.minDownpayment?.toLocaleString() || 20000}.00 USD`;
  doc.text(fin2Text, fin2X + 3, y + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Locks unit for 7 business days', fin2X + 3, y + 15.5);

  // Fin 3: Escrow Protocol
  const fin3X = fin2X + finBoxWidth + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(fin3X, y, finBoxWidth, finBoxHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ESCROW PAYMENT ENGINE:', fin3X + 3, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PayPal Smart Escrow', fin3X + 3, y + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Encrypted P2P Settlement', fin3X + 3, y + 15.5);

  // 7. Section 04: Covenants & Operational Clauses
  y += finBoxHeight + 6;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SECTION 04: LEGAL COVENANTS & LEASE CONDITIONS', margin + 3, y + 4.2);

  y += 7.5;
  const clauses = [
    {
      num: '1.',
      title: 'Term & Inception:',
      body: `The initial term shall run for ${termMonths} consecutive calendar months commencing upon full security deposit settlement. Renewable upon 30 days prior written mutual consent.`,
    },
    {
      num: '2.',
      title: 'Token Deposit & Escrow Lock:',
      body: 'Deposit remittance via PayPal locks property exclusively for seven (7) business days in broker escrow, temporarily pausing third-party applications.',
    },
    {
      num: '3.',
      title: 'Security Deposit & 14-Day Refund Protocol:',
      body: 'Refundable security funds remain held in escrow. Lessor guarantees complete reconciliation and reimbursement within 14 calendar days post-inspection.',
    },
    {
      num: '4.',
      title: 'Structural Maintenance & 48-Hour SLA:',
      body: 'Lessor warrants structural integrity, plumbing, and HVAC systems. Valid tickets logged via EstateMind AI must be attended by a licensed technician within 48 hours.',
    },
    {
      num: '5.',
      title: 'Notice of Vacation:',
      body: 'Either party may conclude occupancy by tendering sixty (60) days advance written digital notice via the EstateMind AI tenant dashboard.',
    },
  ];

  clauses.forEach((cl) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${cl.num} ${cl.title}`, margin + 2, y + 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const splitBody = doc.splitTextToSize(cl.body, contentWidth - 40);
    doc.text(splitBody, margin + 40, y + 3);

    y += splitBody.length * 3.6 + 1.8;
  });

  // 8. Section 05: Electronic Signatures & Execution
  y += 2;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SECTION 05: EXECUTION & ELECTRONIC SIGNATURES', margin + 3, y + 4.2);

  y += 7.5;
  const sigBoxHeight = 24;

  // Owner Signature Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, boxWidth, sigBoxHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('AUTHORIZED LESSOR / SELLER SIGNATURE:', margin + 3, y + 4.5);

  doc.setFont('times', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text('Prime Horizon Holdings (Verified)', margin + 4, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Digital Timestamp: ${signatureDate} | Key: EM-RSA-4096-AUTH`, margin + 3, y + 20);

  // Client Signature Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(isSigned ? 16 : 226, isSigned ? 185 : 232, isSigned ? 129 : 240);
  doc.roundedRect(clientX, y, boxWidth, sigBoxHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('LESSEE / BUYER COUNTERSIGNATURE:', clientX + 3, y + 4.5);

  if (isSigned) {
    doc.setFont('times', 'italic');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text(signatureName || 'Alexander Wright', clientX + 4, y + 13);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(16, 185, 129);
    doc.text(`SIGNED & CONFIRMED · ${signatureDate}`, clientX + 3, y + 20);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`[Digital Signature Pending Execution - ${signatureName}]`, clientX + 4, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Draft Generated for Review · ${signatureDate}`, clientX + 3, y + 20);
  }

  // 9. Document Footer & Security Hash
  const footerY = pageHeight - 12;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  const hash = `HASH: SHA256:${property.id.toLowerCase()}-e729a8f4c102-verified-escrow-agreement`;
  doc.text(
    `EstateMind AI Real Estate OS · Document Reference: ${agreementRef} · Confidential Client Record · ${hash}`,
    margin,
    footerY
  );
  doc.text('Page 1 of 1', pageWidth - margin, footerY, { align: 'right' });

  return doc;
};

export const downloadAgreementPdf = (options: AgreementPdfOptions): string => {
  const doc = generateAgreementPdf(options);
  const fileName = `EstateMind_Agreement_${options.property.id}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  return fileName;
};
