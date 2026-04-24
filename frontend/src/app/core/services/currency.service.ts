import { Injectable, signal, computed } from '@angular/core';

export type CurrencyCode = 'EUR' | 'USD' | 'BRL' | 'GBP';

export const CURRENCIES: { code: CurrencyCode; symbol: string; label: string }[] = [
  { code: 'EUR', symbol: '€',  label: 'EUR' },
  { code: 'USD', symbol: '$',  label: 'USD' },
  { code: 'BRL', symbol: 'R$', label: 'BRL' },
  { code: 'GBP', symbol: '£',  label: 'GBP' },
];

const KEY = '100pro_currency';

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  currency = signal<CurrencyCode>((localStorage.getItem(KEY) as CurrencyCode) || 'EUR');

  readonly symbol = computed(() => CURRENCIES.find(c => c.code === this.currency())?.symbol ?? '€');

  set(code: CurrencyCode) {
    this.currency.set(code);
    localStorage.setItem(KEY, code);
  }

  fmt(amount: number | null | undefined): string {
    if (amount == null) return `${this.symbol()} —`;
    return `${this.symbol()} ${Number(amount).toFixed(2).replace(/\.00$/, '')}`;
  }
}
