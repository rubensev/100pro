import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/components/avatar.component';
import { StarsComponent } from '../../shared/components/stars.component';
import { BookingModalComponent } from './booking-modal.component';
import { Post, Promo, CATEGORIES, getInitialsColor, Service } from '../../shared/models';
import { TranslationService } from '../../i18n/translation.service';

const API_BASE = 'http://localhost:3000';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent, StarsComponent, BookingModalComponent],
  template: `
    <div style="display:flex;flex-direction:column;gap:14px">

      <!-- Search -->
      <div class="card" style="padding:10px 14px;display:flex;gap:10px;align-items:center;transition:var(--tr)"
           [style.border]="focused() ? '1.5px solid var(--p)' : '1.5px solid var(--bo)'"
           [style.box-shadow]="focused() ? '0 0 0 4px oklch(0.42 0.20 250 / 0.09)' : 'var(--sh)'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input [(ngModel)]="query" [placeholder]="i18n.t('home.search.placeholder')"
               (focus)="focused.set(true)" (blur)="focused.set(false)"
               style="flex:1;border:none;outline:none;background:transparent;font-size:14px;color:var(--t)" />
        @if (query) { <button (click)="query=''" style="color:var(--t3);font-size:18px;line-height:1">×</button> }
        <button class="btn btn-p" style="padding:6px 14px;font-size:12px">{{ i18n.t('home.search.btn') }}</button>
      </div>

      <!-- Categories -->
      <div style="display:flex;gap:7px;overflow-x:auto;padding-bottom:2px">
        @for (c of cats; track c.id) {
          <button (click)="selCat = c.id === selCat ? 'all' : c.id"
                  [style.background]="selCat === c.id ? 'var(--p)' : 'var(--ca)'"
                  [style.color]="selCat === c.id ? 'white' : 'var(--t2)'"
                  [style.border]="selCat === c.id ? '1px solid var(--p)' : '1px solid var(--bo)'"
                  style="flex-shrink:0;padding:7px 13px;border-radius:99px;font-size:12px;font-weight:600;cursor:pointer;transition:var(--tr);display:flex;align-items:center;gap:4px">
            <span>{{ c.icon }}</span> {{ i18n.t('cat.' + c.id) }}
          </button>
        }
      </div>

      <!-- Promotions -->
      @if (promos().length > 0) {
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <div style="font-weight:800;font-size:15px">🏷 {{ i18n.t('home.promos.title') }}</div>
            <span class="badge badge-promo">HOT</span>
          </div>
          <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:6px">
            @for (p of promos(); track p.id) {
              <div style="flex-shrink:0;width:220px;border-radius:var(--r);overflow:hidden;border:1px solid var(--bo);background:var(--ca);box-shadow:var(--sh);transition:var(--tr)"
                   (mouseenter)="$any($event.currentTarget).style.transform='translateY(-2px)';$any($event.currentTarget).style.boxShadow='var(--shm)'"
                   (mouseleave)="$any($event.currentTarget).style.transform='none';$any($event.currentTarget).style.boxShadow='var(--sh)'">
                <div [style.background]="'linear-gradient(90deg,' + promoColor(p) + ',var(--p))'" style="height:6px"></div>
                <div style="padding:12px 14px">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                    <app-avatar [initials]="p.provider?.user?.avatarInitials || ''" [color]="promoColor(p)" [size]="32" [border]="false" />
                    <div>
                      <div style="font-weight:700;font-size:12px">{{ p.provider?.user?.name }}</div>
                      <div style="font-size:10px;color:var(--t3)">{{ i18n.t('home.promos.until') }} {{ promoEndsAt(p) }}</div>
                    </div>
                    <span class="badge badge-promo" style="margin-left:auto;font-size:12px;font-weight:800">-{{ p.discountPct }}%</span>
                  </div>
                  <div style="font-weight:600;font-size:13px;margin-bottom:4px">{{ p.service?.name }}</div>
                  <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:10px">
                    <span style="font-size:11px;color:var(--t3);text-decoration:line-through">R$ {{ promoOriginal(p) }}</span>
                    <span style="font-size:16px;font-weight:800;color:var(--re)">R$ {{ promoFinal(p) }}</span>
                  </div>
                  <button class="btn btn-p" style="width:100%;padding:7px;font-size:12px"
                    (click)="openPromoBooking(p)">
                    {{ i18n.t('home.promos.book') }}
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div style="text-align:center;padding:40px;color:var(--t3)">
          <div style="font-size:24px;margin-bottom:8px">⏳</div>
          <div style="font-size:13px">{{ i18n.t('home.loading') }}</div>
        </div>
      }

      <!-- Feed -->
      @if (!loading()) {
        <div>
          <div style="font-weight:800;font-size:15px;margin-bottom:10px">
            {{ selCat === 'all' ? i18n.t('home.feed.title') : catLabel }} · {{ filteredPosts().length }} {{ i18n.t('home.feed.posts') }}
          </div>
          @if (filteredPosts().length === 0) {
            <div class="card" style="padding:48px;text-align:center;color:var(--t3)">
              <div style="font-size:40px;margin-bottom:12px">📭</div>
              <div style="font-weight:600;font-size:16px">{{ i18n.t('home.empty.title') }}</div>
              <div style="font-size:13px;margin-top:6px">{{ i18n.t('home.empty.sub') }}</div>
            </div>
          }
          <div style="display:flex;flex-direction:column;gap:14px">
            @for (post of filteredPosts(); track post.id; let i = $index) {
              <div class="card fu" [style.animation-delay]="i * 0.06 + 's'"
                   style="overflow:hidden;transition:var(--tr)"
                   (mouseenter)="$any($event.currentTarget).style.transform='translateY(-2px)';$any($event.currentTarget).style.boxShadow='var(--shm)'"
                   (mouseleave)="$any($event.currentTarget).style.transform='none';$any($event.currentTarget).style.boxShadow='var(--sh)'">

                <!-- Post header -->
                <div style="padding:12px 14px;display:flex;gap:10px;align-items:flex-start">
                  <app-avatar [initials]="post.author?.avatarInitials || ''" [color]="color(post.author?.avatarInitials || '')" [size]="38" />
                  <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
                      <span style="font-weight:700;font-size:14px">{{ post.author?.name }}</span>
                      @if (post.author?.isProvider) {
                        <div style="width:14px;height:14px;background:var(--ac);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;flex-shrink:0">
                          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
                        </div>
                      }
                      <span class="badge" [class]="post.type === 'provider' ? 'badge-p' : 'badge-g'" style="font-size:10px">{{ post.type === 'provider' ? i18n.t('home.badge.provider') : i18n.t('home.badge.client') }}</span>
                    </div>
                    <div style="font-size:11px;color:var(--t3);margin-top:1px">{{ post.author?.name }} · {{ formatTime(post.createdAt) }}</div>
                    @if (post.type === 'client') { <app-stars [rating]="5" [size]="12" style="display:block;margin-top:3px" /> }
                  </div>
                  <button (click)="toggleSaved(post)"
                          [style.background]="post.saved ? 'oklch(0.95 0.08 25)' : 'var(--bg2)'"
                          style="width:28px;height:28px;border-radius:50%;border:none;cursor:pointer;transition:var(--tr);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <svg width="14" height="14" viewBox="0 0 24 24" [attr.fill]="post.saved ? 'var(--re)' : 'none'" [attr.stroke]="post.saved ? 'var(--re)' : 'var(--t3)'" stroke-width="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>

                <!-- Media: real image -->
                @if (post.imageUrl) {
                  <div style="position:relative;overflow:hidden;max-height:360px">
                    <img [src]="API_BASE + post.imageUrl" style="width:100%;object-fit:cover;display:block" />
                    @if (post.category) {
                      <div style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);color:white;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600">
                        {{ catIcon(post.category) }} {{ catName(post.category) }}
                      </div>
                    }
                  </div>
                }

                <!-- Media: YouTube embed -->
                @if (!post.imageUrl && post.videoUrl) {
                  <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden">
                    <iframe [src]="safeEmbed(post.videoUrl)" frameborder="0" allowfullscreen
                            style="position:absolute;top:0;left:0;width:100%;height:100%"></iframe>
                  </div>
                }

                <!-- Media: legacy placeholder -->
                @if (!post.imageUrl && !post.videoUrl && post.type === 'provider' && post.imageLabel) {
                  <div [style.background]="post.imageColor || 'var(--bg2)'" style="height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;position:relative">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="opacity:0.4">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                    </svg>
                    <span style="font-size:11px;font-family:monospace;opacity:0.45;text-align:center;max-width:180px;line-height:1.4">{{ post.imageLabel }}</span>
                    <div style="position:absolute;top:10px;left:10px;background:rgba(255,255,255,0.88);backdrop-filter:blur(6px);padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600">
                      {{ catIcon(post.category) }} {{ catName(post.category) }}
                    </div>
                  </div>
                }

                <!-- Text -->
                <div style="padding:10px 14px">
                  <p style="font-size:14px;line-height:1.65;color:var(--t)">{{ post.text }}</p>
                </div>

                <!-- Actions -->
                <div style="padding:6px 10px 8px;display:flex;align-items:center;gap:2px;border-top:1px solid var(--bo)">
                  <button (click)="toggleLike(post)" style="display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:8px;background:transparent;color:var(--t2);font-size:12px;font-weight:500;transition:var(--tr)"
                          (mouseenter)="$any($event.currentTarget).style.background='var(--bg2)'" (mouseleave)="$any($event.currentTarget).style.background='transparent'">
                    <svg width="16" height="16" viewBox="0 0 24 24" [attr.fill]="post.liked ? 'var(--re)' : 'none'" [attr.stroke]="post.liked ? 'var(--re)' : 'currentColor'" stroke-width="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {{ post.likesCount }}
                  </button>
                  <button (click)="$any(post)['_showComments'] = !$any(post)['_showComments']" style="display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:8px;background:transparent;color:var(--t2);font-size:12px;font-weight:500;transition:var(--tr)"
                          (mouseenter)="$any($event.currentTarget).style.background='var(--bg2)'" (mouseleave)="$any($event.currentTarget).style.background='transparent'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    {{ post.comments?.length || 0 }}
                  </button>
                  <div style="flex:1"></div>
                  @if (post.type === 'provider') {
                    <button class="btn btn-p" style="padding:6px 14px;font-size:12px"
                      (click)="openBookingForPost(post)">
                      {{ i18n.t('home.book') }}
                    </button>
                  }
                </div>

                <!-- Comments -->
                @if ($any(post)['_showComments']) {
                  <div style="border-top:1px solid var(--bo);padding:10px 14px;display:flex;flex-direction:column;gap:8px">
                    @for (c of post.comments; track c.id) {
                      <div style="display:flex;gap:8px">
                        <div style="width:28px;height:28px;border-radius:50%;background:var(--p);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:white;flex-shrink:0">{{ c.author?.avatarInitials || '?' }}</div>
                        <div style="flex:1;background:var(--bg);border-radius:10px;padding:7px 10px">
                          <div style="display:flex;gap:6px;align-items:baseline">
                            <span style="font-weight:700;font-size:12px">{{ c.author?.name }}</span>
                            <span style="font-size:10px;color:var(--t3)">{{ formatTime(c.createdAt) }}</span>
                          </div>
                          <p style="font-size:12px;color:var(--t);margin-top:2px;line-height:1.5">{{ c.text }}</p>
                        </div>
                      </div>
                    }
                    @if (auth.isLoggedIn()) {
                      <div style="display:flex;gap:8px;margin-top:2px">
                        <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--p),var(--ac));display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:white;flex-shrink:0">{{ myInitials }}</div>
                        <input [(ngModel)]="$any(post)['_newComment']" [placeholder]="i18n.t('home.comment.placeholder')"
                               (keydown.enter)="addComment(post)"
                               style="flex:1;padding:6px 12px;border-radius:99px;border:1px solid var(--bo);font-size:12px;background:var(--bg);outline:none;color:var(--t)" />
                        <button class="btn btn-p" style="padding:6px 12px;font-size:12px" (click)="addComment(post)">→</button>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
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
export class HomeComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);

  i18n = inject(TranslationService);
  sanitizer = inject(DomSanitizer);

  API_BASE = API_BASE;

  cats = CATEGORIES;
  posts = signal<Post[]>([]);
  promos = signal<Promo[]>([]);
  loading = signal(true);
  query = '';
  selCat = 'all';
  focused = signal(false);
  bookingTarget = signal<{ name: string; role: string; initials: string; id: string; services: Service[] } | null>(null);

  get myInitials() { return this.auth.user()?.avatarInitials || 'VC'; }

  ngOnInit() {
    this.api.getPosts().subscribe({
      next: p => { this.posts.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.getActivePromos().subscribe({
      next: ps => this.promos.set(ps),
      error: () => {},
    });
  }

  filteredPosts = computed(() =>
    this.posts().filter(p =>
      (this.selCat === 'all' || p.category === this.selCat) &&
      (!this.query || p.text.toLowerCase().includes(this.query.toLowerCase()) || p.author?.name.toLowerCase().includes(this.query.toLowerCase()))
    )
  );

  get catLabel() { return this.i18n.t('cat.' + this.selCat); }
  catIcon(id: string) { return CATEGORIES.find(c => c.id === id)?.icon || ''; }
  catName(id: string) { return this.i18n.t('cat.' + id); }
  color(initials: string) { return getInitialsColor(initials); }

  safeEmbed(url: string): SafeResourceUrl {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const embedUrl = match ? `https://www.youtube.com/embed/${match[1]}` : url;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  promoColor(p: Promo) { return getInitialsColor(p.provider?.user?.avatarInitials || ''); }
  promoOriginal(p: Promo) { return p.service?.price || 0; }
  promoFinal(p: Promo) { return Math.round((p.service?.price || 0) * (1 - (p.discountPct || 0) / 100)); }
  promoEndsAt(p: Promo) {
    if (!p.endsAt) return '';
    return new Date(p.endsAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  }

  formatTime(createdAt: string) {
    const d = new Date(createdAt);
    const diff = Date.now() - d.getTime();
    if (diff < 3600000) return Math.floor(diff / 60000) + 'min';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
    return Math.floor(diff / 86400000) + 'd';
  }

  toggleLike(post: Post) {
    post.liked = !post.liked;
    post.likesCount += post.liked ? 1 : -1;
    this.api.likePost(post.id).subscribe({ error: () => { post.liked = !post.liked; post.likesCount += post.liked ? 1 : -1; } });
  }

  toggleSaved(post: Post) { post.saved = !post.saved; }

  addComment(post: Post) {
    const p = post as any;
    const text = (p['_newComment'] || '').trim();
    if (!text) return;
    this.api.addComment(post.id, text).subscribe({
      next: (c: any) => {
        if (!post.comments) post.comments = [];
        post.comments.push({ ...c, author: { id: '', email: '', name: this.auth.user()?.name || 'Você', avatarInitials: this.myInitials, isProvider: false } });
        p['_newComment'] = '';
      },
      error: () => {},
    });
  }



  openBookingForPost(post: Post) {
    this.api.getProviderByUserId(post.authorId).subscribe({
      next: provider => {
        if (provider) {
          this.bookingTarget.set({
            name: post.author?.name || '',
            role: provider.role || '',
            initials: post.author?.avatarInitials || '',
            id: provider.id,
            services: provider.services || [],
          });
        }
      },
      error: () => {},
    });
  }

  openPromoBooking(p: Promo) {
    if (!p.provider) return;
    this.bookingTarget.set({
      name: p.provider.user?.name || '',
      role: p.provider.role || '',
      initials: p.provider.user?.avatarInitials || '',
      id: p.providerId,
      services: p.service ? [p.service] : [],
    });
  }
}
