import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LogoComponent } from '../../shared/components/logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LogoComponent],
  template: `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:var(--bg);padding:24px">
      <div class="card pop" style="width:100%;max-width:400px;padding:32px">
        <div style="text-align:center;margin-bottom:28px">
          <div style="display:flex;justify-content:center;margin-bottom:14px"><app-logo size="lg" /></div>
          <div style="font-size:22px;font-weight:800;color:var(--t)">Bem-vindo de volta</div>
          <div style="font-size:13px;color:var(--t3);margin-top:4px">Entre na sua conta 100Pro</div>
        </div>

        @if (error()) {
          <div style="background:oklch(0.95 0.08 25);color:var(--re);padding:10px 14px;
            border-radius:var(--rs);font-size:13px;margin-bottom:16px;font-weight:500">
            {{ error() }}
          </div>
        }

        <form (ngSubmit)="submit()" #f="ngForm">
          <div class="field">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" placeholder="seu@email.com" required />
          </div>
          <div class="field">
            <label>Senha</label>
            <input type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required />
          </div>
          <button type="submit" class="btn btn-p" style="width:100%;padding:11px;font-size:14px;margin-top:4px"
            [disabled]="loading()">
            {{ loading() ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <div style="text-align:center;margin-top:16px;font-size:13px;color:var(--t2)">
          Não tem conta?
          <a routerLink="/auth/register" style="color:var(--p);font-weight:600;text-decoration:none"> Cadastre-se</a>
        </div>

        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--bo);text-align:center">
          <a routerLink="/home" style="font-size:12px;color:var(--t3);text-decoration:none">
            Continuar sem login →
          </a>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  auth = inject(AuthService);
  router = inject(Router);
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  submit() {
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (e) => {
        this.error.set(e.error?.message || 'Credenciais inválidas');
        this.loading.set(false);
      },
    });
  }
}
