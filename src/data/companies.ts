export const COMPANIES = [
  'FTMO',
  'Funding Ticks',
  'Funding Pips',
  'FundedNext',
  'MyForexFunds',
  'Topstep',
  'Tradeify',
  'Apex Trader Funding',
  'The5%ers',
  'E8 Funding',
  'True Forex Funds',
  'Earn2Trade',
  'Aqua Futures',
  'Blue Guardian',
  'Bulenox',
  'DayTraders',
  'Finotive Funding',
  'Lucid Trading',
  'Lux Trading Firm',
  'Maven Trading',
  'Phidias Funding',
  'PropStream',
  'SurgeTrader',
  'Titan Funded Trader',
  'Traders Launch',
  'Uprofit',
]

export const COMPANY_COLORS: Record<string, string> = {
  'FTMO': '#F7941D',
  'Funding Ticks': '#00C2FF',
  'Funding Pips': '#22D3EE',
  'FundedNext': '#A855F7',
  'Topstep': '#3B82F6',
  'Tradeify': '#10B981',
  'Apex Trader Funding': '#F59E0B',
  'The5%ers': '#EC4899',
  'E8 Funding': '#6366F1',
  'Earn2Trade': '#14B8A6',
  'Lucid Trading': '#8B5CF6',
  'Aqua Futures': '#06B6D4',
  'Blue Guardian': '#2563EB',
  'Bulenox': '#7C3AED',
}

export function getCompanyColor(company: string): string {
  return COMPANY_COLORS[company] ?? '#7C3AED'
}
