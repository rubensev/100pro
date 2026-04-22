import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/components/avatar.component';
import { StarsComponent } from '../../shared/components/stars.component';
import { BookingModalComponent } from '../home/booking-modal.component';
import { ProviderProfile, CATEGORIES, getInitialsColor, Service } from '../../shared/models';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AvatarComponent, StarsComponent, BookingModalComponent],
  template: `
    <div style="display:flex;flex-direction:column;gap:14px">

      <!-- Search bar -->
      <div class="card" style="padding:10px 14px;display:flex;gap:10px;align-items:center"
           [style.border]="searchFocused ? '1.5px solid var(--p)' : '1.5px solid var(--bo)'"
           [style.box-shadow]="searchFocused ? '0 0 0 4px oklch(0.42 0.20 250 / 0.09)' : 'var(--sh)'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input [(ngModel)]="searchQ" [placeholder]="i18n.t('explore.search.placeholder')"
               (focus)="searchFocused=true" (blur)="searchFocused=false"
               (ngModelChange)="onSearch()"
               style="flex:1;border:none;outline:none;background:transparent;font-size:14px;color:var(--t)" />
        @if (searchQ) { <button (click)="searchQ='';onSearch()" style="color:var(--t3);font-size:18px;line-height:1;background:none;border:none;cursor:pointer">×</button> }
      </div>

      <!-- Filters row -->
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input [(ngModel)]="cityQ" [placeholder]="i18n.t('explore.filter.city')"
               (ngModelChange)="onSearch()"
               style="padding:7px 12px;border:1px solid var(--bo);border-radius:99px;font-size:12px;background:var(--ca);outline:none;color:var(--t);width:130px" />

        <select [(ngModel)]="minRating" (ngModelChange)="onSearch()"
                style="padding:7px 12px;border:1px solid var(--bo);border-radius:99px;font-size:12px;background:var(--ca);outline:none;color:var(--t)">
          <option value="">{{ i18n.t('explore.filter.any_rating') }}</option>
          <option value="3">⭐ 3+</option>
          <option value="4">⭐ 4+</option>
          <option value="4.5">⭐ 4.5+</option>
        </select>

        @if (searchQ || cityQ || minRating) {
          <button (click)="clearFilters()" class="btn btn-g" style="font-size:12px;padding:6px 12px">{{ i18n.t('explore.filter.clear') }}</button>
        }
        @if (!loading()) {
          <span style="font-size:12px;color:var(--t3);margin-left:auto">{{ providers().length }} {{ i18n.t('explore.filter.results') }}</span>
        }
      </div>

      <!-- Category filter -->
      <div style="display:flex;gap:7px;overflow-x:auto;padding-bottom:2px">
        @for (c of cats; track c.id) {
          <button (click)="selCat = c.id; onSearch()"
                  [style.background]="selCat === c.id ? 'var(--p)' : 'var(--ca)'"
                  [style.color]="selCat === c.id ? 'white' : 'var(--t2)'"
                  [style.border]="selCat === c.id ? '1px solid var(--p)' : '1px solid var(--bo)'"
                  style="flex-shrink:0;padding:7px 13px;border-radius:99px;font-size:12px;font-weight:600;cursor:pointer;transition:var(--tr)">
            {{ c.icon }} {{ i18n.t('cat.' + c.id) }}
          </button>
        }
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div style="text-align:center;padding:40px;color:var(--t3)">
          <div style="font-size:24px;margin-bottom:8px">⏳</div>
          <div style="font-size:13px">{{ i18n.t('explore.loading') }}</div>
        </div>
      }

      <!-- Provider grid -->
      @if (!loading()) {
        @if (providers().length === 0) {
          <div class="card" style="padding:48px;text-align:center;color:var(--t3)">
            <div style="font-size:40px;margin-bottom:12px">👥</div>
            <div style="font-weight:600;font-size:16px">{{ i18n.t('explore.empty.title') }}</div>
            <div style="font-size:13px;margin-top:6px">{{ i18n.t('explore.empty.sub') }}</div>
          </div>
        }
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px">
          @for (p of providers(); track p.id; let i = $index) {
            <div class="fu" style="background:var(--ca);border-radius:var(--r);border:1px solid var(--bo);overflow:hidden;transition:var(--tr)"
                 [style.animation-delay]="i * 0.05 + 's'"
                 (mouseenter)="$any($event.currentTarget).style.transform='translateY(-3px)';$any($event.currentTarget).style.boxShadow='var(--shm)'"
                 (mouseleave)="$any($event.currentTarget).style.transform='none';$any($event.currentTarget).style.boxShadow='var(--sh)'">
              <div [style.background]="'linear-gradient(135deg,' + initColor(p) + '66,' + initColor(p) + '22)'" style="height:70px;position:relative">
                <button (click)="toggleFav(p.id)"
                        [style.background]="favs()[p.id] ? 'oklch(0.95 0.08 25)' : 'var(--bg2)'"
                        style="position:absolute;top:8px;right:8px;width:30px;height:30px;border-radius:50%;border:none;cursor:pointer;transition:var(--tr);display:flex;align-items:center;justify-content:center">
                  <svg width="15" height="15" viewBox="0 0 24 24" [attr.fill]="favs()[p.id] ? 'var(--re)' : 'none'" [attr.stroke]="favs()[p.id] ? 'var(--re)' : 'var(--t3)'" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                @if (p.city) {
                  <div style="position:absolute;bottom:8px;left:10px;font-size:10px;color:rgba(255,255,255,0.9);background:rgba(0,0,0,0.3);padding:2px 8px;border-radius:99px;backdrop-filter:blur(4px)">
                    📍 {{ p.city }}
                  </div>
                }
              </div>
              <div style="padding:0 16px 16px;margin-top:-22px">
                <div style="position:relative;display:inline-block;margin-bottom:8px">
                  <app-avatar [initials]="p.user?.avatarInitials || ''" [color]="initColor(p)" [size]="46" />
                  @if (p.verified) {
                    <div style="position:absolute;bottom:0;right:0;width:14px;height:14px;background:var(--ac);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white">
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
                    </div>
                  }
                </div>
                <div style="font-weight:700;font-size:14px">{{ p.user?.name }}</div>
                <div style="font-size:12px;color:var(--t2);margin-top:1px">{{ p.role }}</div>
                <div style="display:flex;align-items:center;gap:5px;margin:5px 0 8px">
                  <app-stars [rating]="p.rating" [size]="11" />
                  <span style="font-size:11px;font-weight:700">{{ p.rating }}</span>
                  <span style="font-size:10px;color:var(--t3)">({{ p.reviewsCount }} {{ i18n.t('explore.reviews') }})</span>
                </div>
                <div style="display:flex;gap:6px;margin-bottom:10px">
                  @if (minPrice(p)) { <span class="badge badge-p">R$ {{ minPrice(p) }}/h</span> }
                  <span class="badge badge-g">{{ p.jobsCount }} {{ i18n.t('explore.jobs') }}</span>
                </div>
                <div style="display:flex;gap:6px">
                  <a [routerLink]="['/p', p.id]"
                     class="btn btn-g" style="flex:1;padding:8px;font-size:12px;text-decoration:none;justify-content:center">
                    {{ i18n.t('explore.profile') }}
                  </a>
                  <button class="btn btn-p" style="flex:1;padding:8px;font-size:12px"
                    (click)="requireAuth(() => book(p))">
                    {{ i18n.t('explore.book') }}
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (bookingTarget()) {
      <app-booking-modal
        [providerName]="bookingTarget()!.name"
        [providerRole]="bookingTarget()!.role"
        [providerInitials]="bookingTarget()!.initials"
        [providerId]="bookingTarget()!.id"
        [services]="bookingTarget()!.services"
        (close)="bookingTarget.set(null)" />
    }
  `,
})
export class ExploreComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  router = inject(Router);
  i18n = inject(TranslationService);

  cats = CATEGORIES;
  selCat = 'all';
  searchQ = '';
  cityQ = '';
  minRating = '';
  searchFocused = false;
  providers = signal<ProviderProfile[]>([]);
  loading = signal(true);
  favs = signal<Record<string, boolean>>({});
  bookingTarget = signal<{ name: string; role: string; initials: string; id: string; services: Service[] } | null>(null);

  private debounce: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() { this.load(); }

  onSearch() {
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.load(), 350);
  }

  load() {
    this.loading.set(true);
    const params: { q?: string; city?: string; minRating?: number } = {};
    const q = [this.searchQ.trim(), this.selCat !== 'all' ? '' : ''].filter(Boolean).join(' ');
    if (this.searchQ.trim()) params.q = this.searchQ.trim();
    if (this.cityQ.trim()) params.city = this.cityQ.trim();
    if (this.minRating) params.minRating = parseFloat(this.minRating);
    this.api.getProviders(params).subscribe({
      next: ps => {
        const filtered = this.selCat === 'all' ? ps : ps.filter(p => p.category === this.selCat);
        this.providers.set(filtered);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  clearFilters() { this.searchQ = ''; this.cityQ = ''; this.minRating = ''; this.selCat = 'all'; this.load(); }

  initColor(p: ProviderProfile) { return getInitialsColor(p.user?.avatarInitials || ''); }
  minPrice(p: ProviderProfile) { return p.services?.length ? Math.min(...p.services.map(s => s.price)) : null; }
  toggleFav(id: string) { this.favs.update(f => ({ ...f, [id]: !f[id] })); }

  requireAuth(fn: () => void) {
    if (this.auth.isLoggedIn()) fn();
    else this.router.navigate(['/auth/login']);
  }

  book(p: ProviderProfile) {
    this.bookingTarget.set({ name: p.user?.name || '', role: p.role || '', initials: p.user?.avatarInitials || '', id: p.id, services: p.services || [] });
  }
}
