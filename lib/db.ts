export interface CalEvent {
  date: string;      // 'YYYY-MM-DD'
  category: string;  // 'rate' | 'chip' | 'big' | 'ipo'
  label: string;
  detail: string;
  confirmed: string; // 'Y' | '예상'
}
