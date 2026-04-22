import { Component, inject, HostListener, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LogoComponent } from '../../shared/components/logo.component';
import { AvatarComponent } from '../../shared/components/avatar.component';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../i18n/translation.service';

const NAV = [
  { id: 'home',     key: 'nav.home',     path: '/home',     icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  { id: 'explore',  key: 'nav.explore',  path: '/explore',  icon: 'M21 21l-4.35-4.35 M11 11m-8 0a8 8 0 1 0 16 0a8 8 0 0 0 -16 0' },
  { id: 'schedule', key: 'nav.schedule', path: '/schedule', icon: 'M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18', requireAuth: true },
  { id: 'messages', key: 'nav.messages', path: '/messages', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', requireAuth: true },
  { id: 'provider', key: 'nav.provider', path: '/provider', icon: 'M2 7h20v14H2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16', badgePro: true, requireAuth: true },
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
          display:flex;flex-direction:column;gap:2px">
          <div style="padding:0 8px 20px"><app-logo /></div>

          @for (item of visibleNav; track item.id) {
            <a [routerLink]="item.path"
               [style.background]="isActive(item.path) ? 'var(--px)' : 'transparent'"
               [style.color]="isActive(item.path) ? 'var(--p)' : 'var(--t2)'"
               [style.fontWeight]="isActive(item.path) ? '700' : '500'"
               (mouseenter)="onHover($event, true, item.path)"
               (mouseleave)="onHover($event, false, item.path)"
               style="display:flex;align-items:center;gap:12px;padding:10px 12px;
                      border-radius:11px;font-size:13px;cursor:pointer;text-align:left;
                      text-decoration:none;transition:var(--tr);position:relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path [attr.d]="item.icon"/>
              </svg>
              {{ i18n.t(item.key) }}
              @if (item.badgePro) {
                <span style="margin-left:auto;background:var(--ac);color:white;padding:1px 6px;border-radius:99px;font-size:9px;font-weight:700">PRO</span>
              }
            </a>
          }

          <div style="margin-top:auto;display:flex;flex-direction:column;gap:8px">
            <!-- Language switcher -->
            <div style="display:flex;gap:2px;padding:6px 8px;background:var(--bg);border-radius:10px;border:1px solid var(--bo)">
              @for (l of langs; track l.code) {
                <button (click)="i18n.setLang(l.code)"
                        [style.background]="i18n.lang() === l.code ? 'var(--p)' : 'transparent'"
                        [style.color]="i18n.lang() === l.code ? 'white' : 'var(--t2)'"
                        style="flex:1;padding:5px 4px;border-radius:7px;border:none;font-size:11px;font-weight:700;cursor:pointer;transition:var(--tr)">
                  {{ l.label }}
                </button>
              }
            </div>

            @if (auth.isLoggedIn()) {
              <div style="display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:11px;
                background:var(--bg);cursor:pointer;transition:var(--tr)"
                (mouseenter)="$any($event.currentTarget).style.background='var(--px)'"
                (mouseleave)="$any($event.currentTarget).style.background='var(--bg)'">
                <app-avatar [initials]="userInitials" color="linear-gradient(135deg,var(--p),var(--ac))" [size]="34" />
                <div style="flex:1;min-width:0">
                  <div style="font-weight:700;font-size:12px;color:var(--t)">{{ auth.user()?.name }}</div>
                  <div style="font-size:10px;color:var(--t3)">{{ auth.user()?.email }}</div>
                </div>
              </div>
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
            <!-- Mobile language switcher -->
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
            @if (auth.isLoggedIn()) {
              <app-avatar [initials]="userInitials" color="linear-gradient(135deg,var(--p),var(--ac))" [size]="30" />
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
          @for (item of visibleNav; track item.id) {
            <a [routerLink]="item.path"
               [style.color]="isActive(item.path) ? 'var(--p)' : 'var(--t3)'"
               [style.fontWeight]="isActive(item.path) ? '700' : '500'"
               style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;
                      padding:8px 0;text-decoration:none;font-size:9px;transition:var(--tr)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path [attr.d]="item.icon"/>
              </svg>
              {{ i18n.t(item.key) }}
            </a>
          }
        </nav>
      }
    </div>
  `,
})
export class ShellComponent {
  auth = inject(AuthService);
  i18n = inject(TranslationService);
  router = inject(Router);
  mobile = signal(window.innerWidth < 768);

  langs = [
    { code: 'en' as const, label: 'EN' },
    { code: 'pt' as const, label: 'PT' },
    { code: 'fr' as const, label: 'FR' },
  ];

  get visibleNav() {
    return NAV.filter(n => !n.requireAuth || this.auth.isLoggedIn());
  }

  get userInitials() {
    return this.auth.user()?.avatarInitials || this.auth.user()?.name?.slice(0, 2).toUpperCase() || 'VC';
  }

  isActive(path: string) { return this.router.url === path || this.router.url.startsWith(path + '/'); }

  onHover(e: MouseEvent, on: boolean, path: string) {
    const el = e.currentTarget as HTMLElement;
    if (!this.isActive(path)) el.style.background = on ? 'var(--bg)' : 'transparent';
  }

  @HostListener('window:resize')
  onResize() { this.mobile.set(window.innerWidth < 768); }
}
