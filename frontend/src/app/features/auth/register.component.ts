import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LogoComponent } from '../../shared/components/logo.component';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LogoComponent],
  styles: [`
    @keyframes regOrb1 { 0%,100%{transform:translateY(0);}50%{transform:translateY(-14px);} }
    @keyframes regOrb2 { 0%,100%{transform:translateY(0);}50%{transform:translateY(12px);} }
    .left-panel { display:none; }
    @media(min-width:768px){ .left-panel { display:flex; } }
    .auth-input { width:100%;padding:11px 12px 11px 40px;border:1.5px solid var(--bo);border-radius:var(--rs);font-size:14px;color:var(--t);background:var(--ca);outline:none;transition:var(--tr); }
    .auth-input:focus { border-color:var(--p);box-shadow:0 0 0 3px oklch(0.42 0.20 250 / 0.10); }
    .submit-btn { width:100%;padding:13px;border:none;border-radius:var(--rs);font-size:15px;font-weight:700;color:white;cursor:pointer;transition:var(--tr);background:linear-gradient(135deg,oklch(0.42 0.20 250),oklch(0.52 0.20 210),oklch(0.58 0.18 165));box-shadow:0 4px 16px oklch(0.42 0.20 250 / 0.35); }
    .submit-btn:hover { transform:translateY(-1px);box-shadow:0 6px 22px oklch(0.42 0.20 250 / 0.45); }
    .submit-btn:disabled { opacity:0.7;cursor:not-allowed;transform:none; }
    .role-card { border:2px solid var(--bo);border-radius:var(--r);padding:14px 16px;cursor:pointer;transition:var(--tr);display:flex;align-items:center;gap:12px; }
    .role-card:hover { border-color:var(--p);background:var(--px); }
  `],
  template: `
    <div style="min-height:100vh;display:flex;background:var(--bg)">

      <!-- Left brand panel -->
      <div class="left-panel" style="flex:1;position:relative;overflow:hidden;
           background:linear-gradient(145deg,oklch(0.11 0.028 250),oklch(0.16 0.04 230) 55%,oklch(0.13 0.03 200));
           align-items:center;justify-content:center;padding:52px 48px">

        <div style="position:absolute;top:6%;right:12%;width:200px;height:200px;border-radius:50%;
             background:radial-gradient(circle,oklch(0.58 0.18 165 / 0.20),transparent 70%);
             animation:regOrb1 5s ease-in-out infinite;pointer-events:none"></div>
        <div style="position:absolute;bottom:18%;left:6%;width:280px;height:280px;border-radius:50%;
             background:radial-gradient(circle,oklch(0.42 0.20 250 / 0.18),transparent 70%);
             animation:regOrb2 6s ease-in-out infinite;pointer-events:none"></div>
        <svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.04;pointer-events:none">
          <defs><pattern id="reggrid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M56 0L0 0 0 56" fill="none" stroke="white" stroke-width="1"/>
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#reggrid)"/>
        </svg>

        <div class="slide-up" style="position:relative;z-index:1;max-width:340px">
          <div style="margin-bottom:36px"><app-logo size="lg" /></div>
          <div style="font-size:30px;font-weight:800;color:white;line-height:1.22;margin-bottom:14px">
            Join thousands of professionals
          </div>
          <div style="font-size:14px;color:oklch(0.60 0.06 250);line-height:1.75;margin-bottom:36px">
            Whether you need a service or want to offer one — 100pro connects you.
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:var(--rs);background:oklch(0.18 0.04 250)">
              <div style="width:8px;height:8px;border-radius:50%;background:oklch(0.72 0.14 80);flex-shrink:0"></div>
              <span style="color:oklch(0.82 0.05 250);font-size:13px">Free to join — no credit card needed</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:var(--rs);background:oklch(0.18 0.04 250)">
              <div style="width:8px;height:8px;border-radius:50%;background:oklch(0.58 0.18 165);flex-shrink:0"></div>
              <span style="color:oklch(0.82 0.05 250);font-size:13px">Post services and receive bookings</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:var(--rs);background:oklch(0.18 0.04 250)">
              <div style="width:8px;height:8px;border-radius:50%;background:oklch(0.42 0.20 250);flex-shrink:0"></div>
              <span style="color:oklch(0.82 0.05 250);font-size:13px">Message directly with clients</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right form panel -->
      <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;min-height:100vh">
        <div class="slide-up" style="width:100%;max-width:420px">

          <div style="text-align:center;margin-bottom:28px">
            <div style="display:flex;justify-content:center;margin-bottom:18px">
              <div style="filter:drop-shadow(0 0 20px oklch(0.42 0.20 250 / 0.35))">
                <app-logo size="lg" />
              </div>
            </div>
            <div style="font-size:24px;font-weight:800;color:var(--t);margin-bottom:5px">{{ i18n.t('auth.register.title') }}</div>
            <div style="font-size:14px;color:var(--t3)">{{ i18n.t('auth.register.sub') }}</div>
          </div>

          @if (error()) {
            <div class="slide-up" style="background:oklch(0.96 0.06 25);color:var(--re);padding:11px 14px;border-radius:var(--rs);
                 font-size:13px;margin-bottom:16px;font-weight:500;border:1px solid oklch(0.90 0.08 25);
                 display:flex;align-items:center;gap:8px">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ error() }}
            </div>
          }

          <!-- Role selector -->
          <div style="margin-bottom:20px">
            <div style="font-size:12px;font-weight:600;color:var(--t2);margin-bottom:8px">I want to…</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <div class="role-card"
                   [style.border-color]="role() === 'client' ? 'var(--p)' : 'var(--bo)'"
                   [style.background]="role() === 'client' ? 'var(--px)' : 'var(--ca)'"
                   (click)="role.set('client')">
                <div style="width:36px;height:36px;border-radius:10px;background:var(--bg2);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--p)" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                </div>
                <div>
                  <div style="font-weight:700;font-size:13px;color:var(--t)">Find services</div>
                  <div style="font-size:11px;color:var(--t3)">I'm a client</div>
                </div>
              </div>
              <div class="role-card"
                   [style.border-color]="role() === 'provider' ? 'var(--ac)' : 'var(--bo)'"
                   [style.background]="role() === 'provider' ? 'var(--ax)' : 'var(--ca)'"
                   (click)="role.set('provider')">
                <div style="width:36px;height:36px;border-radius:10px;background:var(--bg2);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </div>
                <div>
                  <div style="font-weight:700;font-size:13px;color:var(--t)">Offer services</div>
                  <div style="font-size:11px;color:var(--t3)">I'm a provider</div>
                </div>
              </div>
            </div>
          </div>

          <form (ngSubmit)="submit()" style="display:flex;flex-direction:column;gap:14px">
            <div>
              <label style="font-size:12px;font-weight:600;color:var(--t2);display:block;margin-bottom:6px">{{ i18n.t('auth.name') }}</label>
              <div style="position:relative">
                <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--t3)"
                     width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <input class="auth-input" type="text" [(ngModel)]="name" name="name" [placeholder]="i18n.t('auth.name.placeholder')" required />
              </div>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--t2);display:block;margin-bottom:6px">{{ i18n.t('auth.email') }}</label>
              <div style="position:relative">
                <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--t3)"
                     width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                <input class="auth-input" type="email" [(ngModel)]="email" name="email" placeholder="seu@email.com" required />
              </div>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--t2);display:block;margin-bottom:6px">{{ i18n.t('auth.password') }}</label>
              <div style="position:relative">
                <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--t3)"
                     width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input class="auth-input" [type]="showPass() ? 'text' : 'password'" [(ngModel)]="password" name="password"
                       [placeholder]="i18n.t('auth.password.placeholder')" required minlength="6" style="padding-right:40px" />
                <button type="button" (click)="showPass.update(v=>!v)"
                        style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--t3);background:none;border:none;cursor:pointer">
                  @if (showPass()) {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  } @else {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit" class="submit-btn" [disabled]="loading()">
              @if (loading()) {
                <span style="display:flex;align-items:center;justify-content:center;gap:8px">
                  <svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                  {{ i18n.t('auth.register.loading') }}
                </span>
              } @else { {{ i18n.t('auth.register.btn') }} }
            </button>
          </form>

          <div style="text-align:center;margin-top:20px;font-size:13px;color:var(--t2)">
            {{ i18n.t('auth.register.has_account') }}
            <a routerLink="/auth/login" style="color:var(--p);font-weight:700;text-decoration:none;margin-left:3px">
              {{ i18n.t('auth.register.signin') }}
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  auth = inject(AuthService);
  router = inject(Router);
  i18n = inject(TranslationService);

  name = '';
  email = '';
  password = '';
  role = signal<'client' | 'provider'>('client');
  loading = signal(false);
  error = signal('');
  showPass = signal(false);

  submit() {
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.email, this.password, this.name).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (e) => {
        this.error.set(e.error?.message || this.i18n.t('auth.register_error'));
        this.loading.set(false);
      },
    });
  }
}
