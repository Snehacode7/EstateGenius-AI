import { EmiCalculation } from '../types';

export function calculateEmi(
  propertyPrice: number,
  downpayment: number,
  annualInterestRate: number,
  tenureMonths: number
): EmiCalculation {
  const loanAmount = Math.max(0, propertyPrice - downpayment);

  if (loanAmount <= 0) {
    return {
      propertyPrice,
      downpayment,
      loanAmount: 0,
      interestRate: annualInterestRate,
      tenureMonths,
      monthlyEmi: 0,
      totalInterest: 0,
      totalAmountPayable: downpayment,
    };
  }

  if (annualInterestRate <= 0) {
    const monthlyEmi = loanAmount / tenureMonths;
    return {
      propertyPrice,
      downpayment,
      loanAmount,
      interestRate: 0,
      tenureMonths,
      monthlyEmi: Math.round(monthlyEmi * 100) / 100,
      totalInterest: 0,
      totalAmountPayable: propertyPrice,
    };
  }

  const monthlyRate = annualInterestRate / (12 * 100);
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const monthlyEmi = (loanAmount * monthlyRate * factor) / (factor - 1);
  const totalAmountPayable = monthlyEmi * tenureMonths + downpayment;
  const totalInterest = totalAmountPayable - propertyPrice;

  return {
    propertyPrice,
    downpayment,
    loanAmount,
    interestRate: annualInterestRate,
    tenureMonths,
    monthlyEmi: Math.round(monthlyEmi * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalAmountPayable: Math.round(totalAmountPayable * 100) / 100,
  };
}

export function generateAmortizationSchedule(
  loanAmount: number,
  annualInterestRate: number,
  tenureMonths: number,
  monthlyEmi: number
) {
  const monthlyRate = annualInterestRate / (12 * 100);
  let balance = loanAmount;
  const schedule = [];

  const displayMonths = Math.min(tenureMonths, 12); // preview first 12 months

  for (let m = 1; m <= displayMonths; m++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = Math.min(balance, monthlyEmi - interestPayment);
    balance = Math.max(0, balance - principalPayment);

    schedule.push({
      month: m,
      emi: monthlyEmi,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      remainingBalance: Math.round(balance * 100) / 100,
    });
  }

  return schedule;
}
