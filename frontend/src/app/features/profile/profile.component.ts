import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../i18n/translation.service';
import { AvatarComponent } from '../../shared/components/avatar.component';
import { Post, CATEGORIES, getInitialsColor } from '../../shared/models';

const API_BASE = 'http://localhost:3000';
const PLAN_LIMITS: Record<string, number> = { free: 0, pro: 2, master: 5 };
const PLANS = [
  { id: 'free',   label: 'Free',   price: '€0',  color: 'var(--t2)' },
  { id: 'pro',    label: 'Pro',    price: '€19', color: 'var(--p)' },
  { id: 'master', label: 'Master', price: '€49', color: 'var(--ac)' },
];
const GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#fda085,#f6d365)',
  'linear-gradient(135deg,#89f7fe,#66a6ff)',
];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AvatarComponent],
  template: `
    <div style="max-width:600px;margin:0 auto">

      <!-- Profile header -->
      <div style="padding:24px 0 16px;display:flex;flex-direction:column;align-items:center;gap:14px">
        <div style="position:relative;cursor:pointer" (click)="avatarInput.click()">
          @if (avatarPreview() || auth.user()?.avatarUrl) {
            <img [src]="avatarPreview() || (API_BASE + auth.user()!.avatarUrl)"
                 style="width:88px;height:88px;border-radius:50%;object-fit:cover;border:3px solid var(--p);box-shadow:0 0 0 3px var(--ca)" />
          } @else {
            <app-avatar [initials]="initials()" [color]="initColor()" [size]="88" />
          }
          <div style="position:absolute;bottom:2px;right:2px;width:24px;height:24px;background:var(--p);
            border-radius:50%;display:flex;align-items:center;justify-content:center;border:2.5px solid var(--ca)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
        </div>
        <input #avatarInput type="file" accept="image/*" style="display:none" (change)="onAvatarChange($event)" />

        @if (avatarFile()) {
          <div style="display:flex;gap:8px">
            <button class="btn btn-p" style="font-size:12px" (click)="uploadAvatar()" [disabled]="uploadingAvatar()">
              {{ uploadingAvatar() ? 'Saving...' : 'Save photo' }}
            </button>
            <button class="btn btn-g" style="font-size:12px" (click)="cancelAvatar()">Cancel</button>
          </div>
        }

        <div style="text-align:center">
          <div style="font-weight:800;font-size:20px">{{ auth.user()?.name }}</div>
          <div style="margin-top:4px">
            <span style="font-size:11px;font-weight:700;padding:2px 10px;border-radius:99px;background:var(--px);color:var(--p)">
              {{ planLabel() }}
            </span>
          </div>
        </div>

        <div style="display:flex;gap:40px">
          <div style="text-align:center">
            <div style="font-weight:800;font-size:20px">{{ myPosts().length }}</div>
            <div style="font-size:11px;color:var(--t3);font-weight:500">posts</div>
          </div>
        </div>
      </div>

      <!-- Tab bar -->
      <div style="display:flex;border-top:1px solid var(--bo)">
        <button (click)="tab.set('grid')"
                style="flex:1;padding:12px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;cursor:pointer;transition:var(--tr)"
                [style.border-bottom]="tab() === 'grid' ? '2px solid var(--t)' : '2px solid transparent'">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"
               [style.color]="tab() === 'grid' ? 'var(--t)' : 'var(--t3)'">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </button>
        <button (click)="tab.set('settings')"
                style="flex:1;padding:12px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;cursor:pointer;transition:var(--tr)"
                [style.border-bottom]="tab() === 'settings' ? '2px solid var(--t)' : '2px solid transparent'">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               [style.color]="tab() === 'settings' ? 'var(--t)' : 'var(--t3)'">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      <!-- GRID TAB -->
      @if (tab() === 'grid') {
        <!-- New post form -->
        @if (showNewPost()) {
          <div style="padding:12px;border-bottom:1px solid var(--bo)">
            <div class="card" style="padding:16px;gap:12px;display:flex;flex-direction:column">
              <!-- Photo picker -->
              <div (click)="postInput.click()"
                   style="border:2px dashed var(--bo);border-radius:var(--rs);height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;position:relative;overflow:hidden"
                   [style.border-color]="newImagePreview() ? 'var(--p)' : 'var(--bo)'">
                @if (newImagePreview()) {
                  <img [src]="newImagePreview()" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" />
                  <div style="position:absolute;inset:0;background:rgba(0,0,0,0.38);display:flex;align-items:center;justify-content:center">
                    <span style="color:white;font-size:12px;font-weight:600;background:rgba(0,0,0,0.4);padding:6px 14px;border-radius:99px">
                      Change photo
                    </span>
                  </div>
                } @else {
                  <div style="width:54px;height:54px;border-radius:50%;background:var(--px);display:flex;align-items:center;justify-content:center">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--p)" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                    </svg>
                  </div>
                  <div style="text-align:center">
                    <div style="font-weight:700;font-size:13px;color:var(--t)">Add photo</div>
                    <div style="font-size:11px;color:var(--t3);margin-top:2px">or share a text update</div>
                  </div>
                }
              </div>
              <input #postInput type="file" accept="image/*" style="display:none" (change)="onPostImageChange($event)" />

              <textarea [(ngModel)]="newPostText" placeholder="Write a caption..."
                        style="width:100%;resize:none;font-size:13px;border:1.5px solid var(--bo);border-radius:var(--rs);padding:10px;background:var(--bg);color:var(--t);outline:none;font-family:inherit;line-height:1.5"
                        rows="3"></textarea>

              <!-- Category chips -->
              <div style="display:flex;gap:5px;flex-wrap:wrap">
                @for (c of cats; track c.id) {
                  @if (c.id !== 'all') {
                    <button (click)="newPostCat = c.id"
                            [style.background]="newPostCat === c.id ? 'var(--p)' : 'var(--bg)'"
                            [style.color]="newPostCat === c.id ? 'white' : 'var(--t2)'"
                            [style.border]="newPostCat === c.id ? '1px solid var(--p)' : '1px solid var(--bo)'"
                            style="padding:4px 10px;border-radius:99px;font-size:11px;cursor:pointer;transition:var(--tr)">
                      {{ c.icon }} {{ c.id }}
                    </button>
                  }
                }
              </div>

              <div style="display:flex;gap:8px">
                <button class="btn btn-p" style="flex:1;font-size:13px" (click)="publishPost()" [disabled]="publishing()">
                  {{ publishing() ? 'Posting...' : 'Share' }}
                </button>
                <button class="btn btn-g" style="font-size:13px" (click)="cancelNewPost()">Cancel</button>
              </div>
            </div>
          </div>
        } @else {
          <div style="padding:10px 0;display:flex;justify-content:center">
            <button (click)="showNewPost.set(true)"
                    style="display:flex;align-items:center;gap:6px;padding:8px 20px;border-radius:99px;border:1.5px solid var(--bo);background:var(--ca);font-size:13px;font-weight:600;cursor:pointer;transition:var(--tr);color:var(--t)"
                    (mouseenter)="$any($event.currentTarget).style.borderColor='var(--p)';$any($event.currentTarget).style.color='var(--p)'"
                    (mouseleave)="$any($event.currentTarget).style.borderColor='var(--bo)';$any($event.currentTarget).style.color='var(--t)'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New post
            </button>
          </div>
        }

        <!-- Photo grid -->
        @if (loading()) {
          <div style="text-align:center;padding:48px;color:var(--t3)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
        } @else if (myPosts().length === 0) {
          <div style="text-align:center;padding:56px 24px">
            <div style="width:72px;height:72px;border-radius:50%;border:2px solid var(--bo);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
            <div style="font-weight:800;font-size:16px;margin-bottom:6px">Share your first photo</div>
            <div style="font-size:13px;color:var(--t3);margin-bottom:20px">Your posts will appear here</div>
            <button class="btn btn-p" (click)="showNewPost.set(true)">Add first post</button>
          </div>
        } @else {
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-top:2px">
            @for (post of myPosts(); track post.id) {
              <div (click)="activePost.set(post)"
                   style="aspect-ratio:1;overflow:hidden;cursor:pointer;position:relative;background:var(--bg2)">
                @if (post.imageUrl) {
                  <img [src]="API_BASE + post.imageUrl" style="width:100%;height:100%;object-fit:cover;display:block;transition:opacity 0.15s"
                       (mouseenter)="$any($event.target).style.opacity='0.82'"
                       (mouseleave)="$any($event.target).style.opacity='1'" />
                } @else {
                  <div [style.background]="gradient(post)"
                       style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:10px">
                    <span style="font-size:10px;color:white;text-align:center;line-height:1.4;font-weight:500;
                                 overflow:hidden;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical">
                      {{ post.text }}
                    </span>
                  </div>
                }
                @if (post.likesCount > 0) {
                  <div style="position:absolute;bottom:5px;left:6px;display:flex;align-items:center;gap:3px;
                              color:white;font-size:10px;font-weight:700;text-shadow:0 1px 4px rgba(0,0,0,0.7)">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="0">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {{ post.likesCount }}
                  </div>
                }
              </div>
            }
          </div>
        }
      }

      <!-- SETTINGS TAB -->
      @if (tab() === 'settings') {
        <div style="display:flex;flex-direction:column;gap:14px;padding-top:16px">

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
                     [style.border]="selectedPlan() === plan.id ? '2px solid ' + plan.color : '1.5px solid var(--bo)'"
                     [style.background]="selectedPlan() === plan.id ? 'var(--px)' : 'var(--bg)'"
                     style="border-radius:var(--rs);padding:12px 14px;cursor:pointer;transition:var(--tr);display:flex;align-items:center;gap:12px">
                  <div [style.background]="plan.color" style="width:10px;height:10px;border-radius:50%;flex-shrink:0"></div>
                  <div style="flex:1">
                    <div style="font-weight:700;font-size:13px">{{ plan.label }}</div>
                    <div style="font-size:11px;color:var(--t3)">
                      @if (plan.id === 'free') { {{ i18n.t('pricing.forever') }} }
                      @else { {{ PLAN_LIMITS[plan.id] }} services max }
                    </div>
                  </div>
                  <div style="font-weight:700;font-size:14px" [style.color]="plan.color">{{ plan.price }}/{{ i18n.t('pricing.mo') }}</div>
                  @if (selectedPlan() === plan.id) {
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

          <!-- Sign out -->
          <div class="card" style="padding:20px">
            <button class="btn btn-g" style="width:100%;font-size:13px;color:var(--re)" (click)="auth.logout()">
              {{ i18n.t('nav.signout') }}
            </button>
          </div>
        </div>
      }
    </div>

    <!-- Post detail modal -->
    @if (activePost()) {
      <div class="overlay" (click)="activePost.set(null)" style="z-index:100;align-items:flex-end">
        <div class="pop card" style="width:100%;max-width:520px;max-height:90vh;overflow-y:auto;border-radius:var(--r) var(--r) 0 0"
             (click)="$event.stopPropagation()">
          <!-- Author row -->
          <div style="padding:12px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--bo);position:sticky;top:0;background:var(--ca);z-index:1">
            @if (auth.user()?.avatarUrl) {
              <img [src]="API_BASE + auth.user()!.avatarUrl" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0" />
            } @else {
              <app-avatar [initials]="initials()" [color]="initColor()" [size]="36" />
            }
            <div style="flex:1">
              <div style="font-weight:700;font-size:13px">{{ auth.user()?.name }}</div>
              <div style="font-size:11px;color:var(--t3)">{{ timeAgo(activePost()!.createdAt) }}</div>
            </div>
            <button (click)="activePost.set(null)"
                    style="width:30px;height:30px;border-radius:50%;border:none;background:var(--bg);cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;color:var(--t3)">×</button>
          </div>

          <!-- Image -->
          @if (activePost()!.imageUrl) {
            <img [src]="API_BASE + activePost()!.imageUrl"
                 style="width:100%;max-height:440px;object-fit:cover;display:block" />
          } @else {
            <div [style.background]="gradient(activePost()!)"
                 style="height:220px;display:flex;align-items:center;justify-content:center;padding:24px">
              <span style="color:white;font-size:16px;font-weight:500;text-align:center;line-height:1.6">{{ activePost()!.text }}</span>
            </div>
          }

          <!-- Caption & stats -->
          <div style="padding:14px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--re)" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span style="font-weight:700;font-size:13px">{{ activePost()!.likesCount }}</span>
              <span style="font-size:12px;color:var(--t3)">likes</span>
            </div>
            @if (activePost()!.imageUrl) {
              <div style="font-size:13px;line-height:1.65;color:var(--t)">
                <span style="font-weight:700">{{ auth.user()?.name }}</span>
                {{ activePost()!.text }}
              </div>
            }
            @if (activePost()!.comments?.length) {
              <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">
                @for (c of activePost()!.comments; track c.id) {
                  <div style="font-size:12px;color:var(--t)">
                    <span style="font-weight:700">{{ c.author?.name }}</span> {{ c.text }}
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class ProfileComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  i18n = inject(TranslationService);

  API_BASE = API_BASE;
  PLAN_LIMITS = PLAN_LIMITS;
  plans = PLANS;
  cats = CATEGORIES;

  tab = signal<'grid' | 'settings'>('grid');
  myPosts = signal<Post[]>([]);
  loading = signal(true);
  activePost = signal<Post | null>(null);

  showNewPost = signal(false);
  newPostText = '';
  newPostCat = 'reform';
  newImageFile: File | null = null;
  newImagePreview = signal<string | null>(null);
  publishing = signal(false);

  avatarFile = signal<File | null>(null);
  avatarPreview = signal<string | null>(null);
  uploadingAvatar = signal(false);

  editName = '';
  editEmail = '';
  currentPlan = signal('free');
  selectedPlan = signal('free');
  planChanged = signal(false);
  savingInfo = signal(false);
  infoSuccess = signal(false);
  infoError = signal('');
  savingPlan = signal(false);
  planSuccess = signal(false);

  initials = computed(() => this.auth.user()?.avatarInitials || this.auth.user()?.name?.slice(0, 2).toUpperCase() || 'VC');
  initColor() { return getInitialsColor(this.initials()); }
  planLabel() {
    const p = this.auth.user()?.plan ?? 'free';
    return p.charAt(0).toUpperCase() + p.slice(1);
  }

  gradient(post: Post) {
    const idx = Math.abs(post.id.charCodeAt(0) + post.id.charCodeAt(1)) % GRADIENTS.length;
    return GRADIENTS[idx];
  }

  timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  ngOnInit() {
    const u = this.auth.user();
    if (u) {
      this.editName = u.name;
      this.editEmail = u.email;
      this.currentPlan.set(u.plan ?? 'free');
      this.selectedPlan.set(u.plan ?? 'free');
    }
    this.api.getMe().subscribe({
      next: u => {
        this.editName = u.name;
        this.editEmail = u.email;
        this.currentPlan.set(u.plan ?? 'free');
        this.selectedPlan.set(u.plan ?? 'free');
        this.auth.updateUser(u);
      },
    });
    this.api.getMyPosts().subscribe({
      next: posts => { this.myPosts.set(posts); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  // Avatar
  onAvatarChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.avatarFile.set(file);
    const r = new FileReader();
    r.onload = ev => this.avatarPreview.set(ev.target?.result as string);
    r.readAsDataURL(file);
  }

  cancelAvatar() { this.avatarFile.set(null); this.avatarPreview.set(null); }

  uploadAvatar() {
    const file = this.avatarFile();
    if (!file) return;
    this.uploadingAvatar.set(true);
    this.api.uploadAvatar(file).subscribe({
      next: u => {
        this.auth.updateUser(u);
        this.avatarFile.set(null);
        this.avatarPreview.set(null);
        this.uploadingAvatar.set(false);
      },
      error: () => this.uploadingAvatar.set(false),
    });
  }

  // New post
  onPostImageChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.newImageFile = file;
    const r = new FileReader();
    r.onload = ev => this.newImagePreview.set(ev.target?.result as string);
    r.readAsDataURL(file);
  }

  cancelNewPost() {
    this.showNewPost.set(false);
    this.newPostText = '';
    this.newImageFile = null;
    this.newImagePreview.set(null);
    this.newPostCat = 'reform';
  }

  publishPost() {
    if ((!this.newPostText.trim() && !this.newImageFile) || this.publishing()) return;
    this.publishing.set(true);
    this.api.createPost({ text: this.newPostText.trim(), category: this.newPostCat, type: 'provider' }).subscribe({
      next: post => {
        const done = (p: Post) => {
          this.myPosts.update(ps => [p, ...ps]);
          this.cancelNewPost();
          this.publishing.set(false);
        };
        if (this.newImageFile) {
          this.api.uploadPostImage(post.id, this.newImageFile).subscribe({
            next: updated => done(updated),
            error: () => done(post),
          });
        } else {
          done(post);
        }
      },
      error: () => this.publishing.set(false),
    });
  }

  // Settings
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
      error: e => { this.infoError.set(e.error?.message || 'Error'); this.savingInfo.set(false); },
    });
  }

  selectPlan(id: string) {
    this.selectedPlan.set(id);
    this.planChanged.set(id !== this.currentPlan());
    this.planSuccess.set(false);
  }

  cancelPlan() { this.selectedPlan.set(this.currentPlan()); this.planChanged.set(false); }

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
