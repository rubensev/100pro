import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/components/avatar.component';
import { StarsComponent } from '../../shared/components/stars.component';
import { BookingModalComponent } from '../home/booking-modal.component';
import { ProviderProfile, CATEGORIES, getInitialsColor, Service, Store } from '../../shared/models';
import { TranslationService } from '../../i18n/translation.service';

const API_BASE = 'http://localhost:3000';

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
        @if (searchQ) {
          <button (click)="searchQ='';onSearch()" style="color:var(--t3);font-size:18px;line-height:1;background:none;border:none;cursor:pointer">×</button>
        }
      </div>

      <!-- Result type tabs -->
      <div style="display:flex;gap:4px;background:var(--ca);border-radius:var(--r);padding:5px;border:1px solid var(--bo)">
        @for (t of resultTabs; track t.id) {
          <button (click)="resultTab = t.id"
            [style.background]="resultTab === t.id ? 'var(--p)' : 'transparent'"
            [style.color]="resultTab === t.id ? 'white' : 'var(--t2)'"
            style="flex:1;padding:8px 4px;border-radius:var(--rs);border:none;font-weight:600;font-size:12px;cursor:pointer;transition:var(--tr);display:flex;align-items:center;justify-content:center;gap:5px">
            {{ t.icon }} {{ i18n.t(t.key) }}
            @if (!loading()) {
              <span style="font-size:10px;padding:1px 5px;border-radius:99px"
                [style.background]="resultTab === t.id ? 'rgba(255,255,255,0.25)' : 'var(--bg)'"
                [style.color]="resultTab === t.id ? 'white' : 'var(--t3)'">{{ count(t.id) }}</span>
            }
          </button>
        }
      </div>

      <!-- Filters for professionals tab -->
      @if (resultTab === 'people') {
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
        </div>
      }

      <!-- Category chips -->
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

      @if (!loading()) {

        <!-- ── PROFESSIONALS ── -->
        @if (resultTab === 'people') {
          @if (providers().length === 0) {
            <div class="card" style="padding:48px;text-align:center;color:var(--t3)">
              <div style="font-size:40px;margin-bottom:12px">👥</div>
              <div style="font-weight:600;font-size:16px">{{ i18n.t('explore.empty.title') }}</div>
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
                    <a [routerLink]="['/p', p.id]" class="btn btn-g" style="flex:1;padding:8px;font-size:12px;text-decoration:none;justify-content:center">
                      {{ i18n.t('explore.profile') }}
                    </a>
                    <button class="btn btn-p" style="flex:1;padding:8px;font-size:12px" (click)="book(p)">
                      {{ i18n.t('explore.book') }}
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- ── SERVICES ── -->
        @if (resultTab === 'services') {
          @if (services().length === 0) {
            <div class="card" style="padding:48px;text-align:center;color:var(--t3)">
              <div style="font-size:40px;margin-bottom:12px">🛠</div>
              <div style="font-weight:600;font-size:16px">{{ i18n.t('explore.services.empty') }}</div>
            </div>
          }
          <div style="display:flex;flex-direction:column;gap:10px">
            @for (s of services(); track s.id; let i = $index) {
              <div class="card fu" [style.animation-delay]="i * 0.04 + 's'"
                   style="padding:14px 16px;display:flex;gap:14px;align-items:center;transition:var(--tr)"
                   (mouseenter)="$any($event.currentTarget).style.transform='translateY(-1px)';$any($event.currentTarget).style.boxShadow='var(--shm)'"
                   (mouseleave)="$any($event.currentTarget).style.transform='none';$any($event.currentTarget).style.boxShadow='var(--sh)'">
                <div [style.background]="svcColor(s)" style="width:46px;height:46px;border-radius:var(--rs);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">
                  {{ catIcon(s.category) }}
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:700;font-size:14px">{{ s.name }}</div>
                  <div style="font-size:12px;color:var(--t2);margin-top:2px">{{ s.provider?.user?.name }} @if (s.provider?.city) { · 📍 {{ s.provider?.city }} }</div>
                  @if (s.description) {
                    <div style="font-size:11px;color:var(--t3);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ s.description }}</div>
                  }
                </div>
                <div style="text-align:right;flex-shrink:0">
                  <div style="font-weight:800;font-size:15px;color:var(--p)">R$ {{ s.price }}</div>
                  @if (s.duration) { <div style="font-size:10px;color:var(--t3)">{{ s.duration }} min</div> }
                  @if (s.provider) {
                    <button class="btn btn-p" style="font-size:11px;padding:5px 12px;margin-top:6px" (click)="bookService(s)">
                      {{ i18n.t('explore.book') }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- ── STORES ── -->
        @if (resultTab === 'stores') {
          @if (stores().length === 0) {
            <div class="card" style="padding:48px;text-align:center;color:var(--t3)">
              <div style="font-size:40px;margin-bottom:12px">🏪</div>
              <div style="font-weight:600;font-size:16px">{{ i18n.t('explore.stores.empty') }}</div>
            </div>
          }
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px">
            @for (s of stores(); track s.id; let i = $index) {
              <a [routerLink]="['/p', s.provider?.id]" style="text-decoration:none"
                 class="fu" [style.animation-delay]="i * 0.05 + 's'">
                <div style="background:var(--ca);border-radius:var(--r);border:1px solid var(--bo);overflow:hidden;transition:var(--tr)"
                     (mouseenter)="$any($event.currentTarget).style.transform='translateY(-3px)';$any($event.currentTarget).style.boxShadow='var(--shm)'"
                     (mouseleave)="$any($event.currentTarget).style.transform='none';$any($event.currentTarget).style.boxShadow='var(--sh)'">
                  @if (s.coverUrl) {
                    <img [src]="API_BASE + s.coverUrl" style="width:100%;height:100px;object-fit:cover;display:block" />
                  } @else {
                    <div style="height:80px;background:linear-gradient(135deg,var(--p),var(--ac));display:flex;align-items:center;justify-content:center;font-size:28px">🏪</div>
                  }
                  <div style="padding:12px 14px">
                    <div style="font-weight:700;font-size:14px">{{ s.name }}</div>
                    <div style="font-size:11px;color:var(--t2);margin-top:2px">{{ s.provider?.user?.name }}</div>
                    @if (s.description) {
                      <div style="font-size:11px;color:var(--t3);margin-top:4px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">{{ s.description }}</div>
                    }
                    @if (s.category) { <span class="badge badge-g" style="margin-top:8px;display:inline-block">{{ catIcon(s.category) }} {{ i18n.t('cat.' + s.category) }}</span> }
                  </div>
                </div>
              </a>
            }
          </div>
        }
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
  route = inject(ActivatedRoute);
  i18n = inject(TranslationService);

  API_BASE = API_BASE;
  cats = CATEGORIES;
  selCat = 'all';
  searchQ = '';
  cityQ = '';
  minRating = '';
  searchFocused = false;
  resultTab: 'people' | 'services' | 'stores' = 'people';

  providers = signal<ProviderProfile[]>([]);
  services = signal<Service[]>([]);
  stores = signal<Store[]>([]);
  loading = signal(true);
  favs = signal<Record<string, boolean>>({});
  bookingTarget = signal<{ name: string; role: string; initials: string; id: string; services: any[] } | null>(null);

  resultTabs = [
    { id: 'people' as const,   key: 'explore.tab.people',   icon: '👤' },
    { id: 'services' as const, key: 'explore.tab.services', icon: '🛠' },
    { id: 'stores' as const,   key: 'explore.tab.stores',   icon: '🏪' },
  ];

  private debounce: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    const q = this.route.snapshot.queryParams['q'];
    if (q) this.searchQ = q;
    this.load();
  }

  onSearch() {
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.load(), 350);
  }

  load() {
    this.loading.set(true);
    const q = this.searchQ.trim();
    const provParams: any = {};
    if (q) provParams.q = q;
    if (this.cityQ.trim()) provParams.city = this.cityQ.trim();
    if (this.minRating) provParams.minRating = parseFloat(this.minRating);

    let done = 0;
    const finish = () => { if (++done === 3) this.loading.set(false); };

    this.api.getProviders(provParams).subscribe({
      next: ps => {
        const filtered = this.selCat === 'all' ? ps : ps.filter(p => p.category === this.selCat);
        this.providers.set(filtered);
        finish();
      },
      error: () => finish(),
    });

    this.api.searchServices(q).subscribe({
      next: ss => {
        const filtered = this.selCat === 'all' ? ss : ss.filter(s => s.category === this.selCat);
        this.services.set(filtered);
        finish();
      },
      error: () => finish(),
    });

    this.api.searchStores(q).subscribe({
      next: ss => {
        const filtered = this.selCat === 'all' ? ss : ss.filter(s => s.category === this.selCat);
        this.stores.set(filtered);
        finish();
      },
      error: () => finish(),
    });
  }

  count(tab: string) {
    if (tab === 'people') return this.providers().length;
    if (tab === 'services') return this.services().length;
    return this.stores().length;
  }

  clearFilters() { this.searchQ = ''; this.cityQ = ''; this.minRating = ''; this.selCat = 'all'; this.load(); }

  initColor(p: ProviderProfile) { return getInitialsColor(p.user?.avatarInitials || ''); }
  svcColor(s: Service) { return getInitialsColor(s.provider?.user?.avatarInitials || '') + '33'; }
  minPrice(p: ProviderProfile) { return p.services?.length ? Math.min(...p.services.map(s => s.price)) : null; }
  toggleFav(id: string) { this.favs.update(f => ({ ...f, [id]: !f[id] })); }
  catIcon(id: string) { return CATEGORIES.find(c => c.id === id)?.icon || '🔧'; }

  book(p: ProviderProfile) {
    this.bookingTarget.set({ name: p.user?.name || '', role: p.role || '', initials: p.user?.avatarInitials || '', id: p.id, services: p.services || [] });
  }

  bookService(s: Service) {
    if (!s.provider) return;
    this.bookingTarget.set({ name: s.provider.user?.name || '', role: s.provider.role || '', initials: s.provider.user?.avatarInitials || '', id: s.provider.id, services: [s] });
  }
}
