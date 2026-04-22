import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../i18n/translation.service';
import { AvatarComponent } from '../../shared/components/avatar.component';
import { getInitialsColor } from '../../shared/models';

const PLAN_LIMITS: Record<string, number> = { free: 0, pro: 2, master: 5 };
const PLANS = [
  { id: 'free',   label: 'Free',   price: '€0',  color: 'var(--t2)' },
  { id: 'pro',    label: 'Pro',    price: '€19', color: 'var(--p)' },
  { id: 'master', label: 'Master', price: '€49', color: 'var(--ac)' },
];

const API_BASE = 'http://localhost:3000';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AvatarComponent],
  template: `
    <div style="display:flex;flex-direction:column;gap:16px;max-width:520px">

      <!-- Header -->
      <div style="font-weight:800;font-size:20px">{{ i18n.t('profile.title') }}</div>

      <!-- Avatar section -->
      <div class="card" style="padding:20px">
        <div style="font-weight:700;font-size:14px;margin-bottom:14px">{{ i18n.t('profile.photo') }}</div>
        <div style="display:flex;align-items:center;gap:16px">
          <!-- Avatar preview -->
          <div style="position:relative;cursor:pointer" (click)="fileInput.click()">
            @if (avatarPreview() || auth.user()?.avatarUrl) {
              <img [src]="avatarPreview() || (API_BASE + auth.user()!.avatarUrl)"
                   style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid var(--p)" />
            } @else {
              <app-avatar [initials]="auth.user()?.avatarInitials || ''"
                          [color]="initColor()" [size]="72" />
            }
            <div style="position:absolute;bottom:0;right:0;width:22px;height:22px;background:var(--p);
              border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid var(--ca)">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </div>

          <div>
            <button class="btn btn-o" style="font-size:12px" (click)="fileInput.click()">
              {{ i18n.t('profile.photo.change') }}
            </button>
            <div style="font-size:11px;color:var(--t3);margin-top:6px">{{ i18n.t('profile.photo.hint') }}</div>
          </div>
          <input #fileInput type="file" accept="image/*" style="display:none" (change)="onFileChange($event)" />
        </div>

        @if (avatarFile()) {
          <div style="margin-top:12px;display:flex;gap:8px;align-items:center">
            <button class="btn btn-p" style="font-size:12px" (click)="uploadAvatar()" [disabled]="uploadingAvatar()">
              {{ uploadingAvatar() ? i18n.t('profile.photo.uploading') : i18n.t('profile.photo.save') }}
            </button>
            <button class="btn btn-g" style="font-size:12px" (click)="cancelAvatar()">{{ i18n.t('common.cancel') }}</button>
          </div>
        }

        @if (avatarSuccess()) {
          <div style="margin-top:10px;font-size:12px;color:var(--ac);font-weight:600">✓ {{ i18n.t('profile.photo.done') }}</div>
        }
      </div>

      <!-- Personal info -->
      <div class="card" style="padding:20px">
        <div style="font-weight:700;font-size:14px;margin-bottom:14px">{{ i18n.t('profile.info') }}</div>
        <div class="field">
          <label>{{ i18n.t('auth.name') }}</label>
          <input type="text" [(ngModel)]="editName" />
        </div>
        <div class="field">
          <label>{{ i18n.t('auth.email') }}</label>
          <input type="email" [(ngModel)]="editEmail" />
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
          <button class="btn btn-p" style="font-size:13px" (click)="saveInfo()" [disabled]="savingInfo()">
            {{ savingInfo() ? i18n.t('common.loading') : i18n.t('profile.save') }}
          </button>
          @if (infoSuccess()) {
            <span style="font-size:12px;color:var(--ac);font-weight:600">✓ {{ i18n.t('profile.saved') }}</span>
          }
          @if (infoError()) {
            <span style="font-size:12px;color:var(--re)">{{ infoError() }}</span>
          }
        </div>
      </div>

      <!-- Current plan -->
      <div class="card" style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div style="font-weight:700;font-size:14px">{{ i18n.t('profile.plan') }}</div>
          <a routerLink="/pricing" style="font-size:12px;color:var(--p);font-weight:600;text-decoration:none">
            {{ i18n.t('profile.plan.change') }} →
          </a>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px">
          @for (plan of plans; track plan.id) {
            <div (click)="selectPlan(plan.id)"
                 [style.border]="currentPlan() === plan.id ? '2px solid ' + plan.color : '1.5px solid var(--bo)'"
                 [style.background]="currentPlan() === plan.id ? 'var(--px)' : 'var(--bg)'"
                 style="border-radius:var(--rs);padding:12px 14px;cursor:pointer;transition:var(--tr);display:flex;align-items:center;gap:12px">
              <div [style.background]="plan.color" style="width:10px;height:10px;border-radius:50%;flex-shrink:0"></div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:13px">{{ plan.label }}</div>
                <div style="font-size:11px;color:var(--t3)">
                  @if (plan.id === 'free') { {{ i18n.t('pricing.forever') }} }
                  @else { {{ i18n.t('profile.plan.services', { n: '' + planLimit(plan.id) }) }} }
                </div>
              </div>
              <div style="font-weight:700;font-size:14px" [style.color]="plan.color">{{ plan.price }}/{{ i18n.t('pricing.mo') }}</div>
              @if (currentPlan() === plan.id) {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" [attr.stroke]="plan.color" stroke-width="2.5">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              }
            </div>
          }
        </div>

        @if (planChanged()) {
          <div style="margin-top:12px;display:flex;gap:8px;align-items:center">
            <button class="btn btn-p" style="font-size:12px" (click)="savePlan()" [disabled]="savingPlan()">
              {{ savingPlan() ? i18n.t('common.loading') : i18n.t('profile.plan.save') }}
            </button>
            <button class="btn btn-g" style="font-size:12px" (click)="cancelPlan()">{{ i18n.t('common.cancel') }}</button>
          </div>
        }
        @if (planSuccess()) {
          <div style="margin-top:10px;font-size:12px;color:var(--ac);font-weight:600">✓ {{ i18n.t('profile.plan.saved') }}</div>
        }
      </div>

      <!-- Danger zone -->
      <div class="card" style="padding:20px;border-color:oklch(0.88 0.05 25)">
        <div style="font-weight:700;font-size:14px;margin-bottom:10px;color:var(--re)">{{ i18n.t('profile.danger') }}</div>
        <button class="btn btn-g" style="font-size:13px" (click)="auth.logout()">{{ i18n.t('nav.signout') }}</button>
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  i18n = inject(TranslationService);

  API_BASE = API_BASE;
  plans = PLANS;

  editName = '';
  editEmail = '';
  currentPlan = signal('free');
  selectedPlan = signal('free');

  avatarFile = signal<File | null>(null);
  avatarPreview = signal<string | null>(null);
  uploadingAvatar = signal(false);
  avatarSuccess = signal(false);

  savingInfo = signal(false);
  infoSuccess = signal(false);
  infoError = signal('');

  savingPlan = signal(false);
  planSuccess = signal(false);

  planChanged = signal(false);

  ngOnInit() {
    const u = this.auth.user();
    if (u) {
      this.editName = u.name;
      this.editEmail = u.email;
      this.currentPlan.set(u.plan ?? 'free');
      this.selectedPlan.set(u.plan ?? 'free');
    }
    // Refresh from server
    this.api.getMe().subscribe({
      next: u => {
        this.editName = u.name;
        this.editEmail = u.email;
        this.currentPlan.set(u.plan ?? 'free');
        this.selectedPlan.set(u.plan ?? 'free');
        this.auth.updateUser(u);
      },
    });
  }

  initColor() { return getInitialsColor(this.auth.user()?.avatarInitials ?? ''); }
  planLimit(id: string) { return PLAN_LIMITS[id] ?? 0; }

  onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.avatarFile.set(file);
    const reader = new FileReader();
    reader.onload = ev => this.avatarPreview.set(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  cancelAvatar() {
    this.avatarFile.set(null);
    this.avatarPreview.set(null);
  }

  uploadAvatar() {
    const file = this.avatarFile();
    if (!file) return;
    this.uploadingAvatar.set(true);
    this.api.uploadAvatar(file).subscribe({
      next: u => {
        this.auth.updateUser(u);
        this.avatarFile.set(null);
        this.uploadingAvatar.set(false);
        this.avatarSuccess.set(true);
        setTimeout(() => this.avatarSuccess.set(false), 3000);
      },
      error: () => this.uploadingAvatar.set(false),
    });
  }

  saveInfo() {
    this.savingInfo.set(true);
    this.infoSuccess.set(false);
    this.infoError.set('');
    this.api.updateMe({ name: this.editName, email: this.editEmail }).subscribe({
      next: u => {
        this.auth.updateUser(u);
        this.savingInfo.set(false);
        this.infoSuccess.set(true);
        setTimeout(() => this.infoSuccess.set(false), 3000);
      },
      error: (e) => {
        this.infoError.set(e.error?.message || 'Error');
        this.savingInfo.set(false);
      },
    });
  }

  selectPlan(id: string) {
    this.selectedPlan.set(id);
    this.planChanged.set(id !== this.currentPlan());
    this.planSuccess.set(false);
  }

  cancelPlan() {
    this.selectedPlan.set(this.currentPlan());
    this.planChanged.set(false);
  }

  savePlan() {
    this.savingPlan.set(true);
    this.api.updatePlan(this.selectedPlan()).subscribe({
      next: u => {
        this.auth.updateUser(u);
        this.currentPlan.set(u.plan ?? 'free');
        this.planChanged.set(false);
        this.savingPlan.set(false);
        this.planSuccess.set(true);
        setTimeout(() => this.planSuccess.set(false), 3000);
      },
      error: () => this.savingPlan.set(false),
    });
  }
}
