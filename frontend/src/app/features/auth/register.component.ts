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
  template: `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:var(--bg);padding:24px">
      <div class="card pop" style="width:100%;max-width:400px;padding:32px">
        <div style="text-align:center;margin-bottom:28px">
          <div style="display:flex;justify-content:center;margin-bottom:14px"><app-logo size="lg" /></div>
          <div style="font-size:22px;font-weight:800;color:var(--t)">{{ i18n.t('auth.register.title') }}</div>
          <div style="font-size:13px;color:var(--t3);margin-top:4px">{{ i18n.t('auth.register.sub') }}</div>
        </div>

        @if (error()) {
          <div style="background:oklch(0.95 0.08 25);color:var(--re);padding:10px 14px;
            border-radius:var(--rs);font-size:13px;margin-bottom:16px;font-weight:500">
            {{ error() }}
          </div>
        }

        <form (ngSubmit)="submit()">
          <div class="field">
            <label>{{ i18n.t('auth.name') }}</label>
            <input type="text" [(ngModel)]="name" name="name" [placeholder]="i18n.t('auth.name.placeholder')" required />
          </div>
          <div class="field">
            <label>{{ i18n.t('auth.email') }}</label>
            <input type="email" [(ngModel)]="email" name="email" placeholder="seu@email.com" required />
          </div>
          <div class="field">
            <label>{{ i18n.t('auth.password') }}</label>
            <input type="password" [(ngModel)]="password" name="password" [placeholder]="i18n.t('auth.password.placeholder')" required minlength="6" />
          </div>
          <button type="submit" class="btn btn-p" style="width:100%;padding:11px;font-size:14px;margin-top:4px"
            [disabled]="loading()">
            {{ loading() ? i18n.t('auth.register.loading') : i18n.t('auth.register.btn') }}
          </button>
        </form>

        <div style="text-align:center;margin-top:16px;font-size:13px;color:var(--t2)">
          {{ i18n.t('auth.register.has_account') }}
          <a routerLink="/auth/login" style="color:var(--p);font-weight:600;text-decoration:none"> {{ i18n.t('auth.register.signin') }}</a>
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
  loading = signal(false);
  error = signal('');

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
