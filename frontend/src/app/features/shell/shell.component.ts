import { Component, inject, HostListener, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LogoComponent } from '../../shared/components/logo.component';
import { AvatarComponent } from '../../shared/components/avatar.component';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../i18n/translation.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { CurrencyService, CURRENCIES } from '../../core/services/currency.service';
import { ApiService } from '../../core/services/api.service';
import { Store } from '../../shared/models';

interface NavSubItem { id: string; icon: string; label: string; path: string; params?: Record<string, string>; }
interface NavSection  { id: string; icon: string; label: string; items: NavSubItem[]; }

const NAV = [
  { id: 'home',      key: 'nav.home',     path: '/home',      icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  { id: 'explore',   key: 'nav.explore',  path: '/explore',   icon: 'M21 21l-4.35-4.35 M11 11m-8 0a8 8 0 1 0 16 0a8 8 0 0 0 -16 0' },
  { id: 'schedule',  key: 'nav.schedule', path: '/schedule',  icon: 'M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18', requireAuth: true },
  { id: 'messages',  key: 'nav.messages', path: '/messages',  icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', requireAuth: true },
  { id: 'my-store',  key: 'nav.store',    path: '/my-store',  icon: 'M2 7h20v14H2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16', requireAuth: true, requireProvider: true },
  { id: 'my-services', key: 'nav.services', path: '/my-services', icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z', requireAuth: true, requireProvider: true },
  { id: 'my-agenda', key: 'nav.agenda',   path: '/my-agenda', icon: 'M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18 M8 14h.01 M12 14h.01 M16 14h.01 M8 18h.01 M12 18h.01', requireAuth: true, requireProvider: true },
  { id: 'pricing',   key: 'nav.pricing',  path: '/pricing',   icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, LogoComponent, AvatarComponent],
  template: `
    <div style="display:flex;min-height:100vh;background:var(--bg)">

      <!-- Desktop Sidebar -->
      @if (!mobile()) {
        <aside style="width:220px;flex-shrink:0;height:100vh;position:sticky;top:0;
          background:var(--ca);border-right:1px solid var(--bo);padding:18px 10px;
          display:flex;flex-direction:column;gap:2px;overflow-y:auto">
          <div style="padding:0 8px 20px"><app-logo /></div>

          <!-- Regular nav items (non-provider) -->
          @for (item of desktopTopNav(); track item.id) {
            <a [routerLink]="item.path"
               [style.background]="isActive(item.path) ? 'var(--px)' : 'transparent'"
               [style.color]="isActive(item.path) ? 'var(--p)' : 'var(--t2)'"
               [style.fontWeight]="isActive(item.path) ? '700' : '500'"
               (mouseenter)="onHover($event, true, item.path)"
               (mouseleave)="onHover($event, false, item.path)"
               style="display:flex;align-items:center;gap:12px;padding:10px 12px;
                      border-radius:11px;font-size:13px;cursor:pointer;text-align:left;
                      text-decoration:none;transition:var(--tr);position:relative">
              <div style="position:relative;flex-shrink:0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path [attr.d]="item.icon"/>
                </svg>
                @if (item.id === 'messages' && notif.unreadMessages() > 0) {
                  <div style="position:absolute;top:-3px;right:-3px;width:8px;height:8px;border-radius:50%;background:var(--re);border:1.5px solid var(--ca)"></div>
                }
                @if (item.id === 'schedule' && (notif.upcomingBookings() > 0 || notif.incomingBookings() > 0)) {
                  <div style="position:absolute;top:-3px;right:-3px;width:8px;height:8px;border-radius:50%;background:var(--ac);border:1.5px solid var(--ca)"></div>
                }
              </div>
              {{ i18n.t(item.key) }}
              @if (item.id === 'messages' && notif.unreadMessages() > 0) {
                <span style="margin-left:auto;background:var(--re);color:white;padding:1px 7px;border-radius:99px;font-size:10px;font-weight:700;min-width:20px;text-align:center">{{ notif.unreadMessages() }}</span>
              }
              @if (item.id === 'schedule' && notif.incomingBookings() > 0) {
                <span style="margin-left:auto;background:var(--ac);color:white;padding:1px 7px;border-radius:99px;font-size:10px;font-weight:700;min-width:20px;text-align:center">{{ notif.incomingBookings() }}</span>
              } @else if (item.id === 'schedule' && notif.upcomingBookings() > 0) {
                <span style="margin-left:auto;background:var(--p);color:white;padding:1px 7px;border-radius:99px;font-size:10px;font-weight:700;min-width:20px;text-align:center">{{ notif.upcomingBookings() }}</span>
              }
            </a>
          }

          <!-- Provider expandable sections -->
          @if (auth.user()?.isProvider) {
            <div style="border-top:1px solid var(--bo);margin:6px 0 4px"></div>

            @for (section of providerSections(); track section.id) {
              <!-- Section header -->
              <button (click)="toggle(section.id)"
                      style="display:flex;align-items:center;gap:10px;padding:9px 12px;width:100%;border:none;
                             border-radius:11px;cursor:pointer;transition:var(--tr)"
                      [style.background]="hasActiveSub(section) ? 'var(--px)' : 'transparent'"
                      [style.color]="hasActiveSub(section) ? 'var(--p)' : 'var(--t2)'">
                <span style="font-size:14px;flex-shrink:0;line-height:1">{{ section.icon }}</span>
                <span style="font-size:13px;flex:1;text-align:left;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ section.label }}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                     style="flex-shrink:0;transition:transform 0.2s"
                     [style.transform]="expanded() === section.id ? 'rotate(180deg)' : 'none'">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              <!-- Sub-items -->
              @if (expanded() === section.id) {
                <div style="padding-left:14px;display:flex;flex-direction:column;gap:1px;padding-bottom:4px">
                  @for (item of section.items; track item.id) {
                    <a [routerLink]="item.path" [queryParams]="item.params || null"
                       style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;
                              font-size:12px;text-decoration:none;transition:var(--tr)"
                       [style.background]="isSubActive(item.path, item.params) ? 'var(--px)' : 'transparent'"
                       [style.color]="isSubActive(item.path, item.params) ? 'var(--p)' : 'var(--t3)'"
                       [style.fontWeight]="isSubActive(item.path, item.params) ? '700' : '500'"
                       (mouseenter)="$any($event.currentTarget).style.background = isSubActive(item.path, item.params) ? 'var(--px)' : 'var(--bg)'"
                       (mouseleave)="$any($event.currentTarget).style.background = isSubActive(item.path, item.params) ? 'var(--px)' : 'transparent'">
                      <span style="font-size:13px">{{ item.icon }}</span>
                      {{ item.label }}
                    </a>
                  }
                </div>
              }
            }

            <!-- Agenda direct link -->
            <a routerLink="/my-agenda"
               [style.background]="isActive('/my-agenda') ? 'var(--px)' : 'transparent'"
               [style.color]="isActive('/my-agenda') ? 'var(--p)' : 'var(--t2)'"
               [style.fontWeight]="isActive('/my-agenda') ? '700' : '500'"
               (mouseenter)="onHover($event, true, '/my-agenda')"
               (mouseleave)="onHover($event, false, '/my-agenda')"
               style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:11px;
                      font-size:13px;text-decoration:none;transition:var(--tr)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18 M8 14h.01 M12 14h.01 M16 14h.01 M8 18h.01 M12 18h.01"/>
              </svg>
              {{ i18n.t('nav.agenda') }}
            </a>
          }

          <div style="margin-top:auto;display:flex;flex-direction:column;gap:8px">
            <!-- Currency selector -->
            <div style="display:flex;gap:2px;padding:6px 8px;background:var(--bg);border-radius:10px;border:1px solid var(--bo)">
              @for (c of currencies; track c.code) {
                <button (click)="currency.set(c.code)"
                        [style.background]="currency.currency() === c.code ? 'var(--p)' : 'transparent'"
                        [style.color]="currency.currency() === c.code ? 'white' : 'var(--t2)'"
                        style="flex:1;padding:5px 4px;border-radius:7px;border:none;font-size:10px;font-weight:700;cursor:pointer;transition:var(--tr)">
                  {{ c.label }}
                </button>
              }
            </div>
            <!-- Language + dark mode row -->
            <div style="display:flex;gap:6px;align-items:center">
              <div style="flex:1;display:flex;gap:2px;padding:6px 8px;background:var(--bg);border-radius:10px;border:1px solid var(--bo)">
                @for (l of langs; track l.code) {
                  <button (click)="i18n.setLang(l.code)"
                          [style.background]="i18n.lang() === l.code ? 'var(--p)' : 'transparent'"
                          [style.color]="i18n.lang() === l.code ? 'white' : 'var(--t2)'"
                          style="flex:1;padding:5px 4px;border-radius:7px;border:none;font-size:11px;font-weight:700;cursor:pointer;transition:var(--tr)">
                    {{ l.label }}
                  </button>
                }
              </div>
              <button (click)="theme.toggle()"
                      [style.background]="theme.dark() ? 'var(--px)' : 'var(--bg)'"
                      [style.color]="theme.dark() ? 'var(--p)' : 'var(--t2)'"
                      style="width:36px;height:36px;border-radius:10px;border:1px solid var(--bo);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:var(--tr);flex-shrink:0">
                @if (theme.dark()) {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                } @else {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                }
              </button>
            </div>

            @if (auth.isLoggedIn()) {
              <a routerLink="/profile"
                style="display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:11px;
                background:var(--bg);cursor:pointer;transition:var(--tr);text-decoration:none"
                (mouseenter)="$any($event.currentTarget).style.background='var(--px)'"
                (mouseleave)="$any($event.currentTarget).style.background='var(--bg)'">
                @if (auth.user()?.avatarUrl) {
                  <img [src]="'http://localhost:3000' + auth.user()!.avatarUrl"
                       style="width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0" />
                } @else {
                  <app-avatar [initials]="userInitials" color="linear-gradient(135deg,var(--p),var(--ac))" [size]="34" />
                }
                <div style="flex:1;min-width:0">
                  <div style="font-weight:700;font-size:12px;color:var(--t)">{{ auth.user()?.name }}</div>
                  <div style="font-size:10px;color:var(--t3)">{{ planLabel() }}</div>
                </div>
              </a>
              <button class="btn btn-g" style="width:100%;font-size:12px" (click)="auth.logout()">{{ i18n.t('nav.signout') }}</button>
            } @else {
              <a routerLink="/auth/login" class="btn btn-p" style="width:100%;font-size:13px;text-decoration:none;justify-content:center">{{ i18n.t('nav.signin') }}</a>
            }
          </div>
        </aside>
      }

      <!-- Main content -->
      <main style="flex:1;min-width:0;display:flex;flex-direction:column">
        @if (mobile()) {
          <div style="position:sticky;top:0;z-index:40;background:var(--ca);
            border-bottom:1px solid var(--bo);padding:10px 14px;
            display:flex;align-items:center;justify-content:space-between;gap:8px">
            <app-logo size="sm" />
            <!-- Mobile lang + dark toggle + currency -->
            <div style="display:flex;gap:4px;align-items:center">
              <div style="display:flex;gap:1px;background:var(--bg);border-radius:8px;border:1px solid var(--bo);padding:2px">
                @for (c of currencies; track c.code) {
                  <button (click)="currency.set(c.code)"
                          [style.background]="currency.currency() === c.code ? 'var(--p)' : 'transparent'"
                          [style.color]="currency.currency() === c.code ? 'white' : 'var(--t2)'"
                          style="padding:3px 5px;border-radius:6px;border:none;font-size:9px;font-weight:700;cursor:pointer;transition:var(--tr)">
                    {{ c.label }}
                  </button>
                }
              </div>
              <div style="display:flex;gap:1px;background:var(--bg);border-radius:8px;border:1px solid var(--bo);padding:2px">
                @for (l of langs; track l.code) {
                  <button (click)="i18n.setLang(l.code)"
                          [style.background]="i18n.lang() === l.code ? 'var(--p)' : 'transparent'"
                          [style.color]="i18n.lang() === l.code ? 'white' : 'var(--t2)'"
                          style="padding:3px 7px;border-radius:6px;border:none;font-size:10px;font-weight:700;cursor:pointer;transition:var(--tr)">
                    {{ l.label }}
                  </button>
                }
              </div>
              <button (click)="theme.toggle()"
                      [style.background]="theme.dark() ? 'var(--px)' : 'var(--bg)'"
                      [style.color]="theme.dark() ? 'var(--p)' : 'var(--t2)'"
                      style="width:30px;height:30px;border-radius:8px;border:1px solid var(--bo);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:var(--tr)">
                @if (theme.dark()) {
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                } @else {
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                }
              </button>
            </div>
            @if (auth.isLoggedIn()) {
              <a routerLink="/profile" style="text-decoration:none">
                @if (auth.user()?.avatarUrl) {
                  <img [src]="'http://localhost:3000' + auth.user()!.avatarUrl"
                       style="width:30px;height:30px;border-radius:50%;object-fit:cover" />
                } @else {
                  <app-avatar [initials]="userInitials" color="linear-gradient(135deg,var(--p),var(--ac))" [size]="30" />
                }
              </a>
            } @else {
              <a routerLink="/auth/login" class="btn btn-p" style="font-size:12px;padding:6px 12px;text-decoration:none">{{ i18n.t('nav.signin') }}</a>
            }
          </div>
        }

        <div style="flex:1;overflow-y:auto;max-width:720px;margin:0 auto;width:100%"
             [style.padding]="mobile() ? '14px 14px 72px' : '22px 26px'">
          <router-outlet />
        </div>
      </main>

      <!-- Mobile bottom nav -->
      @if (mobile()) {
        <nav style="position:fixed;bottom:0;left:0;right:0;height:58px;z-index:50;
          background:var(--ca);border-top:1px solid var(--bo);display:flex;backdrop-filter:blur(12px)">
          @for (item of visibleNav(); track item.id) {
            <a [routerLink]="item.path"
               [style.color]="isActive(item.path) ? 'var(--p)' : 'var(--t3)'"
               [style.fontWeight]="isActive(item.path) ? '700' : '500'"
               style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;
                      padding:8px 0;text-decoration:none;font-size:9px;transition:var(--tr)">
              <div style="position:relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path [attr.d]="item.icon"/>
                </svg>
                @if (item.id === 'messages' && notif.unreadMessages() > 0) {
                  <div style="position:absolute;top:-5px;right:-8px;min-width:16px;height:16px;padding:0 4px;border-radius:99px;
                              background:var(--re);color:white;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;
                              border:1.5px solid var(--ca)">{{ notif.unreadMessages() > 99 ? '99+' : notif.unreadMessages() }}</div>
                }
                @if (item.id === 'schedule' && notif.incomingBookings() > 0) {
                  <div style="position:absolute;top:-5px;right:-8px;min-width:16px;height:16px;padding:0 4px;border-radius:99px;
                              background:var(--ac);color:white;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;
                              border:1.5px solid var(--ca)">{{ notif.incomingBookings() }}</div>
                } @else if (item.id === 'schedule' && notif.upcomingBookings() > 0) {
                  <div style="position:absolute;top:-5px;right:-8px;min-width:16px;height:16px;padding:0 4px;border-radius:99px;
                              background:var(--p);color:white;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;
                              border:1.5px solid var(--ca)">{{ notif.upcomingBookings() }}</div>
                }
              </div>
              {{ i18n.t(item.key) }}
            </a>
          }
        </nav>
      }

      <!-- FAB: quick new post for providers -->
      @if (auth.isLoggedIn() && auth.user()?.isProvider) {
        <button (click)="router.navigate(['/provider'], { queryParams: { tab: 'posts' } })"
          style="position:fixed;z-index:60;background:var(--p);color:white;border:none;cursor:pointer;
                 border-radius:50%;display:flex;align-items:center;justify-content:center;
                 box-shadow:0 4px 16px oklch(0.42 0.20 250 / 0.35);transition:var(--tr)"
          [style.width]="mobile() ? '50px' : '44px'"
          [style.height]="mobile() ? '50px' : '44px'"
          [style.bottom]="mobile() ? '68px' : '24px'"
          [style.right]="mobile() ? '16px' : '24px'"
          (mouseenter)="$any($event.currentTarget).style.transform='scale(1.08)'"
          (mouseleave)="$any($event.currentTarget).style.transform='scale(1)'">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      }

      <!-- Login prompt overlay -->
      @if (auth.loginPromptVisible()) {
        <div class="overlay" (click)="auth.loginPromptVisible.set(false)"
             style="z-index:200">
          <div class="pop card" style="width:100%;max-width:360px;padding:32px 28px;text-align:center"
               (click)="$event.stopPropagation()">
            <div style="font-size:36px;margin-bottom:12px">🔐</div>
            <div style="font-weight:800;font-size:18px;margin-bottom:6px">{{ i18n.t('auth.prompt.title') }}</div>
            <div style="font-size:13px;color:var(--t2);margin-bottom:24px">{{ i18n.t('auth.prompt.sub') }}</div>
            <div style="display:flex;flex-direction:column;gap:8px">
              <a [routerLink]="'/auth/login'" (click)="auth.loginPromptVisible.set(false)"
                 class="btn btn-p" style="justify-content:center;text-decoration:none;padding:12px">
                {{ i18n.t('nav.signin') }}
              </a>
              <a [routerLink]="'/auth/register'" (click)="auth.loginPromptVisible.set(false)"
                 class="btn btn-g" style="justify-content:center;text-decoration:none;padding:12px">
                {{ i18n.t('auth.prompt.register') }}
              </a>
              <button (click)="auth.loginPromptVisible.set(false)" class="btn btn-g" style="color:var(--t3)">
                {{ i18n.t('auth.prompt.later') }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ShellComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  i18n = inject(TranslationService);
  theme = inject(ThemeService);
  router = inject(Router);
  notif = inject(NotificationsService);
  currency = inject(CurrencyService);
  api = inject(ApiService);
  currencies = CURRENCIES;
  mobile = signal(window.innerWidth < 768);

  myStores = signal<Store[]>([]);
  myProviderId = signal<string | null>(null);
  expanded = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.auth.user()?.isProvider) {
        this.api.getMyStores().subscribe({ next: ss => this.myStores.set(ss), error: () => {} });
        this.api.getMyProfile().subscribe({ next: p => this.myProviderId.set(p?.id ?? null), error: () => {} });
      } else {
        this.myStores.set([]);
        this.myProviderId.set(null);
        this.expanded.set(null);
      }
    });
  }

  ngOnInit() { if (this.auth.isLoggedIn()) this.notif.start(); }
  ngOnDestroy() { this.notif.stop(); }

  langs = [
    { code: 'en' as const, label: 'EN' },
    { code: 'pt' as const, label: 'PT' },
    { code: 'fr' as const, label: 'FR' },
  ];

  desktopTopNav = computed(() =>
    NAV.filter(n => {
      if ((n as any).requireProvider) return false;
      if (n.requireAuth && !this.auth.isLoggedIn()) return false;
      return true;
    })
  );

  visibleNav = computed(() =>
    NAV.filter(n => {
      if (n.requireAuth && !this.auth.isLoggedIn()) return false;
      if ((n as any).requireProvider && !this.auth.user()?.isProvider) return false;
      return true;
    })
  );

  providerSections = computed((): NavSection[] => {
    const pid = this.myProviderId();
    const profilePath = pid ? `/p/${pid}` : '/provider';
    const sections: NavSection[] = [];

    for (const store of this.myStores()) {
      sections.push({
        id: `store_${store.id}`,
        icon: '🏪',
        label: store.name,
        items: [
          { id: 'dashboard', icon: '📊', label: this.i18n.t('nav.dashboard'), path: '/my-store', params: { s: store.id, t: 'dashboard' } },
          { id: 'posts',     icon: '📝', label: this.i18n.t('nav.posts'),     path: '/provider', params: { tab: 'posts' } },
          { id: 'profile',   icon: '👁', label: this.i18n.t('nav.profile'),   path: `/store/${store.id}` },
          { id: 'settings',  icon: '⚙️', label: this.i18n.t('nav.settings'), path: '/my-store', params: { s: store.id, t: 'config' } },
        ],
      });
    }

    sections.push({
      id: 'services',
      icon: '🛠',
      label: this.i18n.t('nav.services'),
      items: [
        { id: 'dashboard', icon: '📊', label: this.i18n.t('nav.dashboard'), path: '/my-services', params: { t: 'list' } },
        { id: 'posts',     icon: '📝', label: this.i18n.t('nav.posts'),     path: '/provider', params: { tab: 'posts' } },
        { id: 'profile',   icon: '👁', label: this.i18n.t('nav.profile'),   path: profilePath },
        { id: 'settings',  icon: '⚙️', label: this.i18n.t('nav.settings'), path: '/my-services', params: { t: 'config' } },
      ],
    });

    sections.push({
      id: 'person',
      icon: '👤',
      label: this.i18n.t('nav.person'),
      items: [
        { id: 'posts',    icon: '📝', label: this.i18n.t('nav.posts'),    path: '/provider', params: { tab: 'posts' } },
        { id: 'profile',  icon: '👁', label: this.i18n.t('nav.profile'),  path: profilePath },
        { id: 'settings', icon: '⚙️', label: this.i18n.t('nav.settings'), path: '/provider', params: { tab: 'profile' } },
      ],
    });

    return sections;
  });

  toggle(id: string) {
    this.expanded.set(this.expanded() === id ? null : id);
  }

  isSubActive(path: string, params?: Record<string, string>): boolean {
    const [base, qs] = this.router.url.split('?');
    if (base !== path) return false;
    if (!params || !Object.keys(params).length) return !qs;
    const sp = new URLSearchParams(qs || '');
    return Object.entries(params).every(([k, v]) => sp.get(k) === v);
  }

  hasActiveSub(section: NavSection): boolean {
    return section.items.some(item => this.isSubActive(item.path, item.params));
  }

  get userInitials() {
    return this.auth.user()?.avatarInitials || this.auth.user()?.name?.slice(0, 2).toUpperCase() || 'VC';
  }

  isActive(path: string) { return this.router.url === path || this.router.url.startsWith(path + '/'); }

  planLabel() {
    const plan = this.auth.user()?.plan ?? 'free';
    return plan.charAt(0).toUpperCase() + plan.slice(1) + ' plan';
  }

  onHover(e: MouseEvent, on: boolean, path: string) {
    const el = e.currentTarget as HTMLElement;
    if (!this.isActive(path)) el.style.background = on ? 'var(--bg)' : 'transparent';
  }

  @HostListener('window:resize')
  onResize() { this.mobile.set(window.innerWidth < 768); }
}
