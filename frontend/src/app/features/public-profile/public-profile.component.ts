import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../i18n/translation.service';
import { AvatarComponent } from '../../shared/components/avatar.component';
import { StarsComponent } from '../../shared/components/stars.component';
import { BookingModalComponent } from '../home/booking-modal.component';
import { ProviderProfile, getInitialsColor, Service, Store } from '../../shared/models';

const API_BASE = 'http://localhost:3000';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, AvatarComponent, StarsComponent, BookingModalComponent],
  template: `
    @if (loading()) {
      <div style="text-align:center;padding:60px;color:var(--t3)">
        <div style="font-size:32px;margin-bottom:12px">⏳</div>
        <div style="font-size:13px">{{ i18n.t('common.loading') }}</div>
      </div>
    }

    @if (!loading() && !profile()) {
      <div style="text-align:center;padding:60px;color:var(--t3)">
        <div style="font-size:40px;margin-bottom:12px">😕</div>
        <div style="font-weight:600;font-size:16px">{{ i18n.t('pubprofile.notfound') }}</div>
      </div>
    }

    @if (profile(); as p) {
      <!-- Cover + Avatar header -->
      <div style="margin:-22px -26px 0;position:relative" class="cover-area">
        <!-- Cover image or gradient -->
        <div [style.background]="coverBg(p)"
             style="height:180px;width:100%;position:relative;overflow:hidden">
          @if (p.coverUrl) {
            <img [src]="API_BASE + p.coverUrl" style="width:100%;height:100%;object-fit:cover" />
          }
          <!-- Share button -->
          <button (click)="share()" style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.35);
            backdrop-filter:blur(6px);color:white;border:none;border-radius:99px;padding:6px 14px;
            font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            {{ i18n.t('pubprofile.share') }}
          </button>
        </div>

        <!-- Avatar overlap -->
        <div style="padding:0 20px;margin-top:-36px;position:relative;display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap">
          <div style="border:3px solid var(--ca);border-radius:50%;background:var(--ca)">
            @if (p.user?.avatarUrl) {
              <img [src]="API_BASE + p.user!.avatarUrl"
                   style="width:72px;height:72px;border-radius:50%;object-fit:cover;display:block" />
            } @else {
              <app-avatar [initials]="p.user?.avatarInitials || ''"
                          [color]="initColor(p)" [size]="72" [border]="false" />
            }
          </div>
          <!-- CTAs -->
          <div style="display:flex;gap:8px;margin-left:auto;padding-bottom:4px;flex-wrap:wrap">
            <button class="btn btn-g" style="font-size:13px" (click)="message(p)">
              💬 {{ i18n.t('pubprofile.message') }}
            </button>
            <button class="btn btn-p" style="font-size:13px" (click)="book(p)">
              📅 {{ i18n.t('pubprofile.book') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Name + meta -->
      <div style="padding:12px 0 4px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <h1 style="font-size:22px;font-weight:800;color:var(--t);margin:0">{{ p.user?.name }}</h1>
          @if (p.verified) {
            <div style="background:var(--ac);border-radius:99px;padding:3px 10px;display:flex;align-items:center;gap:4px">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
              <span style="font-size:10px;font-weight:700;color:white">{{ i18n.t('pubprofile.verified') }}</span>
            </div>
          }
        </div>
        <div style="font-size:14px;color:var(--t2);margin-top:3px">{{ p.role }}</div>
        <div style="display:flex;align-items:center;gap:14px;margin-top:8px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:5px">
            <app-stars [rating]="p.rating" [size]="12" />
            <span style="font-weight:700;font-size:13px">{{ p.rating }}</span>
            <span style="font-size:12px;color:var(--t3)">({{ p.reviewsCount }} {{ i18n.t('explore.reviews') }})</span>
          </div>
          @if (p.city) {
            <div style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--t3)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {{ p.city }}
            </div>
          }
        </div>
      </div>

      <!-- Stats row -->
      <div class="card" style="padding:14px 20px;display:flex;gap:0;margin:4px 0">
        @for (stat of stats(p); track stat.label) {
          <div style="flex:1;text-align:center;border-right:1px solid var(--bo)" [style.border-right]="$last ? 'none' : '1px solid var(--bo)'">
            <div style="font-weight:800;font-size:20px;color:var(--p)">{{ stat.value }}</div>
            <div style="font-size:11px;color:var(--t3);margin-top:2px">{{ stat.label }}</div>
          </div>
        }
      </div>

      <!-- Bio -->
      @if (p.bio) {
        <div class="card" style="padding:16px 18px">
          <div style="font-weight:700;font-size:13px;margin-bottom:8px;color:var(--t2)">{{ i18n.t('pubprofile.about') }}</div>
          <p style="font-size:13px;color:var(--t);line-height:1.7;margin:0">{{ p.bio }}</p>
        </div>
      }

      <!-- Services -->
      @if (p.services?.length) {
        <div>
          <div style="font-weight:700;font-size:15px;margin-bottom:10px">{{ i18n.t('pubprofile.services') }}</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            @for (svc of p.services; track svc.id) {
              <div class="card" style="padding:14px 16px;display:flex;align-items:center;gap:12px">
                <div style="flex:1">
                  <div style="font-weight:700;font-size:14px">{{ svc.name }}</div>
                  @if (svc.description) {
                    <div style="font-size:12px;color:var(--t3);margin-top:2px">{{ svc.description }}</div>
                  }
                  <div style="font-size:11px;color:var(--t3);margin-top:4px">⏱ {{ svc.duration }} {{ i18n.t('booking.min') }}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-weight:800;font-size:16px;color:var(--p)">R$ {{ svc.price }}</div>
                  <button class="btn btn-p" style="font-size:11px;padding:5px 12px;margin-top:6px" (click)="bookService(p, svc)">
                    {{ i18n.t('explore.book') }}
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Stores -->
      @if (stores().length) {
        <div>
          <div style="font-weight:700;font-size:15px;margin-bottom:10px">🏪 {{ i18n.t('pubprofile.stores') }}</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            @for (store of stores(); track store.id) {
              <div class="card" style="overflow:hidden">
                @if (store.coverUrl) {
                  <img [src]="API_BASE + store.coverUrl" style="width:100%;height:120px;object-fit:cover;display:block" />
                } @else {
                  <div style="height:70px;background:linear-gradient(135deg,var(--p)33,var(--ac)22)"></div>
                }
                <div style="padding:12px 16px">
                  <div style="font-weight:700;font-size:15px">{{ store.name }}</div>
                  @if (store.description) { <div style="font-size:13px;color:var(--t2);margin-top:4px;line-height:1.5">{{ store.description }}</div> }
                  @if (store.category) { <span class="badge badge-g" style="margin-top:8px;display:inline-block">{{ store.category }}</span> }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Active promos -->
      @if (activePromos(p).length) {
        <div>
          <div style="font-weight:700;font-size:15px;margin-bottom:10px">🏷️ {{ i18n.t('pubprofile.promos') }}</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            @for (promo of activePromos(p); track promo.id) {
              <div class="card" style="padding:14px 16px;border-left:3px solid var(--re)">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                  <div>
                    <div style="font-weight:700;font-size:14px">{{ promo.title }}</div>
                    <div style="font-size:12px;color:var(--t2);margin-top:2px">{{ promo.service?.name }}</div>
                    @if (promo.endsAt) {
                      <div style="font-size:11px;color:var(--t3);margin-top:4px">
                        {{ i18n.t('home.promos.until') }} {{ promo.endsAt | date:'dd/MM' }}
                      </div>
                    }
                  </div>
                  <span class="badge badge-promo" style="font-size:13px;font-weight:800">-{{ promo.discountPct }}%</span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Posts -->
      @if (p.posts?.length) {
        <div>
          <div style="font-weight:700;font-size:15px;margin-bottom:10px">{{ i18n.t('pubprofile.posts') }}</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            @for (post of p.posts; track post.id) {
              <div class="card" style="padding:14px 16px">
                <div style="display:flex;gap:10px;align-items:flex-start">
                  @if (p.user?.avatarUrl) {
                    <img [src]="API_BASE + p.user!.avatarUrl"
                         style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0" />
                  } @else {
                    <app-avatar [initials]="p.user?.avatarInitials || ''" [color]="initColor(p)" [size]="36" />
                  }
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:700;font-size:13px">{{ p.user?.name }}</div>
                    <div style="font-size:11px;color:var(--t3)">{{ formatTime(post.createdAt) }}</div>
                    <p style="font-size:13px;color:var(--t);margin-top:6px;line-height:1.6">{{ post.text }}</p>
                    <div style="font-size:12px;color:var(--t3);margin-top:6px">❤ {{ post.likesCount }}</div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }
    }

    <!-- Booking modal -->
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
export class PublicProfileComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  api = inject(ApiService);
  auth = inject(AuthService);
  i18n = inject(TranslationService);

  API_BASE = API_BASE;
  profile = signal<ProviderProfile | null>(null);
  stores = signal<Store[]>([]);
  loading = signal(true);
  bookingTarget = signal<{ name: string; role: string; initials: string; id: string; services: Service[] } | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getPublicProfile(id).subscribe({
      next: p => {
        this.profile.set(p);
        this.loading.set(false);
        this.api.getStoresByProvider(p.id).subscribe({ next: s => this.stores.set(s), error: () => {} });
      },
      error: () => this.loading.set(false),
    });
  }

  initColor(p: ProviderProfile) { return getInitialsColor(p.user?.avatarInitials || ''); }
  activePromos(p: ProviderProfile) { return p.promos?.filter(pr => pr.active) ?? []; }
  stats(p: ProviderProfile) {
    return [
      { value: p.jobsCount, label: this.i18n.t('provider.jobs') },
      { value: p.reviewsCount, label: this.i18n.t('provider.reviews') },
      { value: p.services?.length ?? 0, label: this.i18n.t('pubprofile.services') },
    ];
  }

  coverBg(p: ProviderProfile) {
    const c = this.initColor(p);
    return `linear-gradient(135deg, ${c}cc, ${c}44)`;
  }

  book(p: ProviderProfile) {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/auth/login']); return; }
    this.bookingTarget.set({
      name: p.user?.name || '',
      role: p.role || '',
      initials: p.user?.avatarInitials || '',
      id: p.id,
      services: p.services || [],
    });
  }

  bookService(p: ProviderProfile, svc: Service) {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/auth/login']); return; }
    this.bookingTarget.set({
      name: p.user?.name || '',
      role: p.role || '',
      initials: p.user?.avatarInitials || '',
      id: p.id,
      services: [svc],
    });
  }

  message(p: ProviderProfile) {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/auth/login']); return; }
    this.router.navigate(['/messages'], { queryParams: {
      with: p.userId,
      name: p.user?.name,
      initials: p.user?.avatarInitials || (p.user?.name?.slice(0, 2).toUpperCase() ?? '??'),
    }});
  }

  share() {
    if (navigator.share) {
      navigator.share({ url: window.location.href, title: this.profile()?.user?.name || '' });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  formatTime(createdAt: string) {
    const diff = Date.now() - new Date(createdAt).getTime();
    if (diff < 3600000) return Math.max(1, Math.floor(diff / 60000)) + 'min';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
    return Math.floor(diff / 86400000) + 'd';
  }
}
