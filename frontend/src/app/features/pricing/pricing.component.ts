import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from '../../i18n/translation.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

type Currency = 'EUR' | 'USD' | 'BRL' | 'GBP';

const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: 'EUR', symbol: '€', label: 'EUR' },
  { code: 'USD', symbol: '$', label: 'USD' },
  { code: 'BRL', symbol: 'R$', label: 'BRL' },
  { code: 'GBP', symbol: '£', label: 'GBP' },
];

const PLANS = [
  {
    id: 'free',
    nameKey: 'pricing.plan.free',
    monthlyEUR: 0,
    highlighted: false,
    badge: null,
    ctaKey: 'pricing.cta.free',
    ctaRoute: '/auth/register',
    features: [
      { key: 'pricing.feat.browse', included: true },
      { key: 'pricing.feat.book', included: true },
      { key: 'pricing.feat.message', included: true },
      { key: 'pricing.feat.services0', included: false },
      { key: 'pricing.feat.explore', included: false },
      { key: 'pricing.feat.feed', included: false },
      { key: 'pricing.feat.promos', included: false },
    ],
  },
  {
    id: 'pro',
    nameKey: 'pricing.plan.pro',
    monthlyEUR: 19,
    highlighted: true,
    badge: 'pricing.popular',
    ctaKey: 'pricing.cta.pro',
    ctaRoute: '/auth/register',
    features: [
      { key: 'pricing.feat.browse', included: true },
      { key: 'pricing.feat.book', included: true },
      { key: 'pricing.feat.message', included: true },
      { key: 'pricing.feat.services2', included: true },
      { key: 'pricing.feat.explore', included: true },
      { key: 'pricing.feat.feed', included: true },
      { key: 'pricing.feat.promos', included: true },
    ],
  },
  {
    id: 'master',
    nameKey: 'pricing.plan.master',
    monthlyEUR: 49,
    highlighted: false,
    badge: null,
    ctaKey: 'pricing.cta.master',
    ctaRoute: '/auth/register',
    features: [
      { key: 'pricing.feat.browse', included: true },
      { key: 'pricing.feat.book', included: true },
      { key: 'pricing.feat.message', included: true },
      { key: 'pricing.feat.services5', included: true },
      { key: 'pricing.feat.explore', included: true },
      { key: 'pricing.feat.feed', included: true },
      { key: 'pricing.feat.promos', included: true },
      { key: 'pricing.feat.featured', included: true },
      { key: 'pricing.feat.support', included: true },
    ],
  },
];

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="display:flex;flex-direction:column;gap:24px">

      <!-- Header -->
      <div style="text-align:center;padding:8px 0 4px">
        <div style="display:inline-flex;align-items:center;gap:8px;background:var(--px);color:var(--p);
          padding:5px 14px;border-radius:99px;font-size:11px;font-weight:700;margin-bottom:14px">
          ✦ {{ i18n.t('pricing.badge') }}
        </div>
        <h1 style="font-size:26px;font-weight:800;color:var(--t);margin-bottom:8px;line-height:1.2">
          {{ i18n.t('pricing.title') }}
        </h1>
        <p style="font-size:14px;color:var(--t2);max-width:420px;margin:0 auto;line-height:1.6">
          {{ i18n.t('pricing.sub') }}
        </p>
      </div>

      <!-- Controls: billing toggle + currency -->
      <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px">

        <!-- Billing toggle -->
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:13px;font-weight:600;color:var(--t2)">{{ i18n.t('pricing.monthly') }}</span>
          <button (click)="yearly.set(!yearly())"
                  [style.background]="yearly() ? 'var(--p)' : 'var(--bo)'"
                  style="width:42px;height:24px;border-radius:99px;position:relative;transition:var(--tr);border:none;cursor:pointer">
            <span [style.left]="yearly() ? '20px' : '3px'"
                  style="position:absolute;top:3px;width:18px;height:18px;background:white;border-radius:50%;transition:var(--tr);display:block"></span>
          </button>
          <span style="display:flex;align-items:center;gap:6px">
            <span style="font-size:13px;font-weight:600;color:var(--t2)">{{ i18n.t('pricing.yearly') }}</span>
            <span style="background:oklch(0.92 0.10 145);color:oklch(0.38 0.14 145);font-size:10px;font-weight:700;
              padding:2px 8px;border-radius:99px">{{ i18n.t('pricing.save') }}</span>
          </span>
        </div>

        <!-- Currency pills -->
        <div style="display:flex;gap:2px;background:var(--bg);border:1px solid var(--bo);border-radius:10px;padding:3px">
          @for (c of currencies; track c.code) {
            <button (click)="currency.set(c.code)"
                    [style.background]="currency() === c.code ? 'var(--p)' : 'transparent'"
                    [style.color]="currency() === c.code ? 'white' : 'var(--t2)'"
                    style="padding:5px 11px;border-radius:8px;font-size:12px;font-weight:700;
                      cursor:pointer;transition:var(--tr);border:none">
              {{ c.label }}
            </button>
          }
        </div>
      </div>

      <!-- Loading rates -->
      @if (loadingRates()) {
        <div style="text-align:center;font-size:12px;color:var(--t3)">{{ i18n.t('pricing.rates.loading') }}</div>
      }

      <!-- Plan cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(195px,1fr));gap:12px;align-items:start">
        @for (plan of plans; track plan.id) {
          <div [style.border]="plan.highlighted ? '2px solid var(--p)' : '1px solid var(--bo)'"
               [style.background]="plan.highlighted ? 'var(--ca)' : 'var(--ca)'"
               style="border-radius:var(--r);overflow:hidden;position:relative;transition:var(--tr)"
               [style.box-shadow]="plan.highlighted ? 'var(--shm)' : 'var(--sh)'">

            <!-- Popular badge -->
            @if (plan.badge) {
              <div style="background:linear-gradient(90deg,var(--p),var(--ac));color:white;
                text-align:center;font-size:10px;font-weight:700;padding:5px;letter-spacing:0.08em">
                ✦ {{ i18n.t(plan.badge) }}
              </div>
            }

            <div style="padding:20px 18px">
              <!-- Plan name -->
              <div style="font-weight:800;font-size:16px;color:var(--t);margin-bottom:4px">
                {{ i18n.t(plan.nameKey) }}
              </div>

              <!-- Price -->
              <div style="display:flex;align-items:baseline;gap:4px;margin:12px 0 4px">
                @if (plan.monthlyEUR === 0) {
                  <span style="font-size:34px;font-weight:800;color:var(--t)">{{ i18n.t('pricing.free') }}</span>
                } @else {
                  <span style="font-size:11px;font-weight:700;color:var(--t2);align-self:flex-start;margin-top:8px">{{ currencySymbol() }}</span>
                  <span style="font-size:34px;font-weight:800;color:var(--t)">{{ displayPrice(plan.monthlyEUR) }}</span>
                  <span style="font-size:12px;color:var(--t3)">/{{ i18n.t('pricing.mo') }}</span>
                }
              </div>

              <!-- Yearly note -->
              @if (plan.monthlyEUR > 0) {
                @if (yearly()) {
                  <div style="font-size:11px;color:var(--t3);margin-bottom:14px">
                    {{ currencySymbol() }}{{ displayYearlyTotal(plan.monthlyEUR) }} {{ i18n.t('pricing.billed.yearly') }}
                  </div>
                } @else {
                  <div style="font-size:11px;color:var(--t3);margin-bottom:14px">{{ i18n.t('pricing.billed.monthly') }}</div>
                }
              } @else {
                <div style="font-size:11px;color:var(--t3);margin-bottom:14px">{{ i18n.t('pricing.forever') }}</div>
              }

              <!-- CTA -->
              @if (isCurrentPlan(plan.id)) {
                <div style="display:block;text-align:center;padding:10px;border-radius:var(--rs);
                  font-size:13px;font-weight:700;background:var(--ax);color:var(--ac);margin-bottom:18px">
                  ✓ {{ i18n.t('pricing.current') }}
                </div>
              } @else if (auth.isLoggedIn()) {
                <button (click)="changePlan(plan.id)"
                        [disabled]="changingPlan()"
                        [style.background]="plan.highlighted ? 'var(--p)' : 'var(--bg2)'"
                        [style.color]="plan.highlighted ? 'white' : 'var(--t2)'"
                        [style.border]="plan.highlighted ? 'none' : '1px solid var(--bo)'"
                        style="display:block;width:100%;text-align:center;padding:10px;border-radius:var(--rs);
                          font-size:13px;font-weight:700;cursor:pointer;transition:var(--tr);margin-bottom:18px">
                  {{ changingPlan() ? i18n.t('common.loading') : i18n.t(plan.ctaKey) }}
                </button>
              } @else {
                <a [routerLink]="plan.ctaRoute"
                   [style.background]="plan.highlighted ? 'var(--p)' : 'var(--bg2)'"
                   [style.color]="plan.highlighted ? 'white' : 'var(--t2)'"
                   [style.border]="plan.highlighted ? 'none' : '1px solid var(--bo)'"
                   style="display:block;text-align:center;padding:10px;border-radius:var(--rs);
                     font-size:13px;font-weight:700;text-decoration:none;transition:var(--tr);margin-bottom:18px">
                  {{ i18n.t(plan.ctaKey) }}
                </a>
              }

              <!-- Divider -->
              <div style="height:1px;background:var(--bo);margin-bottom:14px"></div>

              <!-- Features -->
              <div style="display:flex;flex-direction:column;gap:9px">
                @for (feat of plan.features; track feat.key) {
                  <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px">
                    @if (feat.included) {
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;margin-top:1px">
                        <circle cx="12" cy="12" r="10" fill="var(--ac)" opacity="0.15"/>
                        <path d="M8 12l3 3 5-5" stroke="var(--ac)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <span style="color:var(--t)">{{ i18n.t(feat.key) }}</span>
                    } @else {
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;margin-top:1px">
                        <circle cx="12" cy="12" r="10" fill="var(--t3)" opacity="0.12"/>
                        <path d="M15 9l-6 6M9 9l6 6" stroke="var(--t3)" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                      <span style="color:var(--t3)">{{ i18n.t(feat.key) }}</span>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Bottom note -->
      <div style="text-align:center;font-size:12px;color:var(--t3);padding-bottom:8px">
        {{ i18n.t('pricing.note') }}
      </div>
    </div>
  `,
})
export class PricingComponent implements OnInit {
  i18n = inject(TranslationService);
  auth = inject(AuthService);
  api = inject(ApiService);
  http = inject(HttpClient);

  plans = PLANS;
  currencies = CURRENCIES;

  yearly = signal(false);
  currency = signal<Currency>('EUR');
  rates = signal<Record<string, number>>({ USD: 1.09, BRL: 5.45, GBP: 0.86, EUR: 1 });
  loadingRates = signal(false);
  changingPlan = signal(false);

  currencySymbol = computed(() => CURRENCIES.find(c => c.code === this.currency())?.symbol ?? '€');

  ngOnInit() {
    this.loadingRates.set(true);
    this.http.get<any>('https://api.frankfurter.app/latest?from=EUR&to=USD,BRL,GBP').subscribe({
      next: data => {
        this.rates.set({ ...data.rates, EUR: 1 });
        this.loadingRates.set(false);
      },
      error: () => this.loadingRates.set(false),
    });
  }

  displayPrice(monthlyEUR: number): string {
    const rate = this.rates()[this.currency()] ?? 1;
    const monthly = monthlyEUR * rate;
    const price = this.yearly() ? monthly * 10 / 12 : monthly;
    return this.format(price);
  }

  displayYearlyTotal(monthlyEUR: number): string {
    const rate = this.rates()[this.currency()] ?? 1;
    return this.format(monthlyEUR * rate * 10);
  }

  isCurrentPlan(id: string): boolean {
    return this.auth.isLoggedIn() && (this.auth.user()?.plan ?? 'free') === id;
  }

  changePlan(id: string) {
    if (!this.auth.isLoggedIn()) return;
    this.changingPlan.set(true);
    this.api.updatePlan(id).subscribe({
      next: u => {
        this.auth.updateUser(u);
        this.changingPlan.set(false);
      },
      error: () => this.changingPlan.set(false),
    });
  }

  private format(n: number): string {
    return n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);
  }
}
