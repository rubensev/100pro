import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/components/avatar.component';
import { CATEGORIES, Service, Promo, Store, ProviderProfile, getInitialsColor } from '../../shared/models';
import { TranslationService } from '../../i18n/translation.service';

const API_BASE = 'http://localhost:3000';

const HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat'];

function buildSlots() {
  const s: Record<string, Record<string, boolean>> = {};
  DAYS.forEach(d => { s[d] = {}; HOURS.forEach(h => { s[d][h] = h >= '09:00' && h <= '17:00'; }); });
  return s;
}

@Component({
  selector: 'app-provider',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent, RouterLink],
  template: `
    <div style="display:flex;flex-direction:column;gap:14px">

      <!-- Header card -->
      <div style="display:flex;align-items:center;gap:12px;padding:14px 18px;
        background:linear-gradient(135deg,var(--p),var(--ac));border-radius:var(--r);color:white">
        <app-avatar [initials]="initials" color="rgba(255,255,255,0.25)" [size]="52" [border]="false" />
        <div>
          <div style="font-weight:800;font-size:18px">{{ profile().name }}</div>
          <div style="opacity:0.8;font-size:13px">{{ profile().role || i18n.t('provider.mode') }}</div>
          <div style="display:flex;gap:12px;margin-top:5px">
            <span style="font-size:12px;opacity:0.9">⭐ {{ profile().rating || '—' }}</span>
            <span style="font-size:12px;opacity:0.9">💬 {{ profile().reviewsCount || 0 }} {{ i18n.t('provider.reviews') }}</span>
            <span style="font-size:12px;opacity:0.9">✅ {{ profile().jobsCount || 0 }} {{ i18n.t('provider.jobs') }}</span>
          </div>
        </div>
        <div style="margin-left:auto;display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          <div style="background:rgba(255,255,255,0.18);padding:6px 14px;border-radius:99px;font-size:12px;font-weight:600">{{ i18n.t('provider.mode') }}</div>
          @if (profile().id) {
            <a [routerLink]="['/p', profile().id]"
               style="background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.9);padding:5px 12px;
               border-radius:99px;font-size:11px;font-weight:600;text-decoration:none;
               display:flex;align-items:center;gap:4px;white-space:nowrap">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              {{ i18n.t('provider.view.public') }}
            </a>
          }
        </div>
      </div>

      <!-- Tab bar -->
      <div style="display:flex;gap:4px;overflow-x:auto;background:var(--ca);border-radius:var(--r);padding:6px;border:1px solid var(--bo);box-shadow:var(--sh)">
        @for (t of tabs; track t.id) {
          <button (click)="tab = t.id"
                  [style.background]="tab === t.id ? 'var(--p)' : 'transparent'"
                  [style.color]="tab === t.id ? 'white' : 'var(--t2)'"
                  style="flex:0 0 auto;padding:8px 16px;border-radius:var(--rs);border:none;font-weight:600;font-size:13px;cursor:pointer;transition:var(--tr);display:flex;align-items:center;gap:6px;white-space:nowrap">
            {{ t.icon }} {{ i18n.t(t.key) }}
          </button>
        }
      </div>

      <!-- PROFILE TAB -->
      @if (tab === 'profile') {
        <!-- Cover photo card -->
        <div class="card" style="overflow:hidden">
          <!-- Cover banner -->
          <div style="height:130px;position:relative;overflow:hidden"
               [style.background]="profile().coverUrl ? 'var(--bg2)' : 'linear-gradient(135deg,' + color + '66,' + color + '22)'">
            @if (profile().coverUrl) {
              <img [src]="API_BASE + profile().coverUrl" style="width:100%;height:100%;object-fit:cover;display:block" />
            }
            @if (coverUploading()) {
              <div style="position:absolute;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center">
                <span style="color:white;font-size:13px;font-weight:600">{{ i18n.t('provider.cover.uploading') }}…</span>
              </div>
            }
            <!-- Upload overlay button -->
            <label style="position:absolute;bottom:10px;right:10px;display:flex;align-items:center;gap:6px;
                          background:rgba(0,0,0,0.5);backdrop-filter:blur(6px);color:white;
                          padding:6px 14px;border-radius:99px;font-size:12px;font-weight:600;
                          cursor:pointer;transition:var(--tr)"
                   (mouseenter)="$any($event.currentTarget).style.background='rgba(0,0,0,0.7)'"
                   (mouseleave)="$any($event.currentTarget).style.background='rgba(0,0,0,0.5)'">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              {{ profile().coverUrl ? i18n.t('provider.cover.change') : i18n.t('provider.cover.upload') }}
              <input type="file" accept="image/*" style="display:none" (change)="onCoverChange($event)" />
            </label>
          </div>
          @if (coverError()) {
            <div style="padding:8px 16px;font-size:12px;color:var(--re)">{{ coverError() }}</div>
          }
          <div style="padding:10px 16px;font-size:12px;color:var(--t3)">{{ i18n.t('provider.cover.hint') }}</div>
        </div>

        <div class="card" style="padding:20px">
          <div style="font-weight:800;font-size:16px;margin-bottom:16px">{{ i18n.t('provider.profile.edit') }}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="field" style="grid-column:1/-1"><label>{{ i18n.t('provider.profile.name') }}</label><input type="text" [(ngModel)]="pf.name" /></div>
            <div class="field"><label>{{ i18n.t('provider.profile.role') }}</label><input type="text" [(ngModel)]="pf.role" /></div>
            <div class="field"><label>{{ i18n.t('provider.profile.category') }}</label>
              <select [(ngModel)]="pf.category">
                @for (c of cats; track c.id) { <option [value]="c.id">{{ c.icon }} {{ i18n.t('cat.' + c.id) }}</option> }
              </select>
            </div>
            <div class="field"><label>{{ i18n.t('provider.profile.phone') }}</label><input type="text" [(ngModel)]="pf.phone" /></div>
            <div class="field"><label>{{ i18n.t('provider.profile.city') }}</label><input type="text" [(ngModel)]="pf.city" /></div>
            <div class="field" style="grid-column:1/-1"><label>{{ i18n.t('provider.profile.bio') }}</label><textarea [(ngModel)]="pf.bio" style="min-height:90px"></textarea></div>
          </div>
          @if (savePfError()) { <div style="color:var(--re);font-size:12px;margin-top:6px">{{ savePfError() }}</div> }
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
            <button class="btn btn-g" (click)="resetPf()">{{ i18n.t('common.cancel') }}</button>
            <button class="btn btn-p" (click)="saveProfile()">{{ savedPf() ? i18n.t('provider.profile.saved') : i18n.t('provider.profile.save') }}</button>
          </div>
        </div>
      }

      <!-- SERVICES TAB -->
      @if (tab === 'services') {
        @if (svcForm()) {
          <div class="card" style="padding:20px">
            <div style="font-weight:800;font-size:16px;margin-bottom:16px">{{ svcForm()!.id ? i18n.t('provider.svc.edit_title') : i18n.t('provider.svc.new_title') }}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="field" style="grid-column:1/-1"><label>{{ i18n.t('provider.svc.name') }}</label><input type="text" [(ngModel)]="svcForm()!.name" placeholder="Ex: Projeto Residencial" /></div>
              <div class="field"><label>{{ i18n.t('provider.svc.price') }}</label><input type="number" [(ngModel)]="svcForm()!.price" placeholder="0" /></div>
              <div class="field"><label>{{ i18n.t('provider.svc.duration') }}</label><input type="number" [(ngModel)]="svcForm()!.duration" placeholder="60" /></div>
              <div class="field"><label>{{ i18n.t('provider.svc.category') }}</label>
                <select [(ngModel)]="svcForm()!.category">
                  @for (c of cats; track c.id) { <option [value]="c.id">{{ c.icon }} {{ i18n.t('cat.' + c.id) }}</option> }
                </select>
              </div>
              <div class="field" style="grid-column:1/-1"><label>{{ i18n.t('provider.svc.desc') }}</label><textarea [(ngModel)]="svcForm()!.description" [placeholder]="i18n.t('provider.svc.desc') + '...'"></textarea></div>
            </div>
            @if (svcError()) { <div style="color:var(--re);font-size:12px;margin-top:6px">{{ svcError() }}</div> }
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
              <button class="btn btn-g" (click)="svcForm.set(null);svcError.set('')">{{ i18n.t('common.cancel') }}</button>
              <button class="btn btn-p" (click)="saveService()">{{ i18n.t('provider.svc.save') }}</button>
            </div>
          </div>
        } @else {
          <div style="display:flex;flex-direction:column;gap:10px">
            <!-- Upgrade nudge -->
            <div style="background:linear-gradient(135deg,var(--px),var(--ax));border:1.5px solid var(--p);
              border-radius:var(--r);padding:14px 16px;display:flex;align-items:center;gap:12px">
              <div style="font-size:28px">🚀</div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:13px;color:var(--t)">{{ i18n.t('pricing.upgrade.title') }}</div>
                <div style="font-size:12px;color:var(--t2);margin-top:2px">{{ i18n.t('pricing.upgrade.sub') }}</div>
              </div>
              <a routerLink="/pricing" class="btn btn-p" style="font-size:12px;white-space:nowrap;text-decoration:none">
                {{ i18n.t('pricing.upgrade.cta') }}
              </a>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center">
              <div><div style="font-weight:700;font-size:15px">{{ i18n.t('provider.svc.title') }}</div><div style="font-size:12px;color:var(--t3)">{{ services().length }} {{ i18n.t('provider.svc.count') }}</div></div>
              <button class="btn btn-p" (click)="svcForm.set({ name:'', price:0, duration:60, category:'reform', description:'' })">{{ i18n.t('provider.svc.new') }}</button>
            </div>
            @for (s of services(); track s.id) {
              <div class="card" style="padding:14px 16px;display:flex;gap:12px;align-items:center">
                <div style="flex:1">
                  <div style="font-weight:700;font-size:14px;margin-bottom:3px">{{ s.name }}</div>
                  <div style="font-size:12px;color:var(--t2);margin-bottom:4px">{{ s.description }}</div>
                  <div style="display:flex;gap:8px">
                    <span class="badge badge-p">R$ {{ s.price }}</span>
                    <span class="badge badge-g">{{ s.duration }} min</span>
                    <span class="badge badge-g">{{ catIcon(s.category) }} {{ catName(s.category) }}</span>
                  </div>
                </div>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-g" style="padding:6px 12px;font-size:12px" (click)="svcForm.set({...s})">{{ i18n.t('common.edit') }}</button>
                  <button class="btn btn-danger" style="padding:6px 12px;font-size:12px" (click)="deleteService(s.id!)">{{ i18n.t('common.delete') }}</button>
                </div>
              </div>
            }
            @if (services().length === 0) {
              <div class="card" style="padding:40px;text-align:center;color:var(--t3)">
                <div style="font-size:32px;margin-bottom:8px">🛠</div>
                <div style="font-weight:600">{{ i18n.t('provider.svc.empty') }}</div>
                <div style="font-size:13px;margin-top:4px">{{ i18n.t('provider.svc.empty_sub') }}</div>
              </div>
            }
          </div>
        }
      }

      <!-- STORES TAB -->
      @if (tab === 'stores') {
        @if (storeForm()) {
          <div class="card" style="padding:20px">
            <div style="font-weight:800;font-size:16px;margin-bottom:16px">{{ storeForm()!.id ? i18n.t('provider.store.edit_title') : i18n.t('provider.store.new_title') }}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="field" style="grid-column:1/-1"><label>{{ i18n.t('provider.store.name') }}</label><input type="text" [(ngModel)]="storeForm()!.name" [placeholder]="i18n.t('provider.store.name_ph')" /></div>
              <div class="field" style="grid-column:1/-1"><label>{{ i18n.t('provider.store.desc') }}</label><textarea [(ngModel)]="storeForm()!.description" style="min-height:72px"></textarea></div>
              <div class="field"><label>{{ i18n.t('provider.store.category') }}</label>
                <select [(ngModel)]="storeForm()!.category">
                  @for (c of cats; track c.id) { <option [value]="c.id">{{ c.icon }} {{ i18n.t('cat.' + c.id) }}</option> }
                </select>
              </div>
              <div class="field" style="display:flex;align-items:center;gap:10px;padding-top:22px">
                <input type="checkbox" [(ngModel)]="storeForm()!.active" style="width:16px;height:16px" />
                <label style="margin-bottom:0;font-size:13px">{{ i18n.t('provider.store.active') }}</label>
              </div>
            </div>
            @if (storeError()) { <div style="color:var(--re);font-size:12px;margin-top:6px">{{ storeError() }}</div> }
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
              <button class="btn btn-g" (click)="storeForm.set(null);storeError.set('')">{{ i18n.t('common.cancel') }}</button>
              <button class="btn btn-p" (click)="saveStore()">{{ i18n.t('provider.store.save') }}</button>
            </div>
          </div>
        } @else {
          <div style="display:flex;flex-direction:column;gap:10px">
            <!-- Plan info banner -->
            <div style="background:linear-gradient(135deg,var(--px),var(--ax));border:1.5px solid var(--p);
                border-radius:var(--r);padding:14px 16px;display:flex;align-items:center;gap:12px">
              <div style="font-size:28px">🏪</div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:13px;color:var(--t)">{{ i18n.t('provider.store.plan_info') }}</div>
                <div style="font-size:12px;color:var(--t2);margin-top:2px">{{ storePlanLabel() }}</div>
              </div>
              @if ((auth.user()?.plan || 'free') === 'free') {
                <a routerLink="/pricing" class="btn btn-p" style="font-size:12px;white-space:nowrap;text-decoration:none">{{ i18n.t('pricing.upgrade.cta') }}</a>
              }
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center">
              <div><div style="font-weight:700;font-size:15px">{{ i18n.t('provider.store.title') }}</div><div style="font-size:12px;color:var(--t3)">{{ stores().length }} {{ i18n.t('provider.store.count') }}</div></div>
              @if ((auth.user()?.plan || 'free') !== 'free') {
                <button class="btn btn-p" (click)="storeForm.set({ name:'', description:'', category:'reform', active:true })">{{ i18n.t('provider.store.new') }}</button>
              }
            </div>

            @for (s of stores(); track s.id) {
              <div class="card" style="overflow:hidden;border:1.5px solid var(--bo)">
                <!-- Store cover -->
                <div style="height:110px;position:relative;overflow:hidden"
                     [style.background]="s.coverUrl ? 'var(--bg2)' : 'linear-gradient(135deg,' + color + '44,' + color + '11)'">
                  @if (s.coverUrl) {
                    <img [src]="API_BASE + s.coverUrl" style="width:100%;height:100%;object-fit:cover;display:block" />
                  }
                  @if (storeCoverUploading() === s.id) {
                    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center">
                      <span style="color:white;font-size:12px;font-weight:600">{{ i18n.t('provider.cover.uploading') }}…</span>
                    </div>
                  }
                  <label style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.5);backdrop-filter:blur(6px);
                         color:white;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:600;cursor:pointer">
                    {{ i18n.t('provider.cover.change') }}
                    <input type="file" accept="image/*" style="display:none" (change)="onStoreCoverChange($event, s.id)" />
                  </label>
                  @if (!s.active) {
                    <div style="position:absolute;top:8px;left:8px;background:var(--t3);color:white;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600">{{ i18n.t('provider.store.inactive') }}</div>
                  }
                </div>
                <div style="padding:12px 16px;display:flex;gap:12px;align-items:flex-start">
                  <div style="flex:1">
                    <div style="font-weight:700;font-size:15px">{{ s.name }}</div>
                    @if (s.description) { <div style="font-size:12px;color:var(--t2);margin-top:3px;line-height:1.5">{{ s.description }}</div> }
                    @if (s.category) { <span class="badge badge-g" style="margin-top:6px;display:inline-block">{{ catIcon(s.category) }} {{ catName(s.category) }}</span> }
                  </div>
                  <div style="display:flex;gap:6px;flex-shrink:0">
                    <button class="btn btn-g" style="padding:6px 12px;font-size:12px" (click)="storeForm.set({...s})">{{ i18n.t('common.edit') }}</button>
                    <button class="btn btn-danger" style="padding:6px 12px;font-size:12px" (click)="deleteStore(s.id)">{{ i18n.t('common.delete') }}</button>
                  </div>
                </div>
              </div>
            }

            @if (stores().length === 0) {
              <div class="card" style="padding:40px;text-align:center;color:var(--t3)">
                <div style="font-size:36px;margin-bottom:10px">🏪</div>
                <div style="font-weight:600;font-size:15px">{{ i18n.t('provider.store.empty') }}</div>
                <div style="font-size:13px;margin-top:6px">{{ i18n.t('provider.store.empty_sub') }}</div>
              </div>
            }
          </div>
        }
      }

      <!-- AGENDA TAB -->
      @if (tab === 'agenda') {
        <div class="card" style="padding:20px;overflow-x:auto">
          <div style="font-weight:700;font-size:15px;margin-bottom:4px">{{ i18n.t('provider.agenda.title') }}</div>
          <div style="font-size:12px;color:var(--t3);margin-bottom:16px">{{ i18n.t('provider.agenda.sub') }}</div>
          <div style="display:grid;gap:3px;min-width:500px" [style.grid-template-columns]="'60px repeat(' + weekDays.length + ',1fr)'">
            <div></div>
            @for (d of weekDays; track d) {
              <div style="text-align:center;font-weight:700;font-size:11px;color:var(--t2);padding:4px 0;background:var(--bg2);border-radius:6px">{{ i18n.t('day.' + d) }}</div>
            }
            @for (h of hours; track h) {
              <div style="font-size:10px;color:var(--t3);padding-right:4px;display:flex;align-items:center;justify-content:flex-end">{{ h }}</div>
              @for (d of weekDays; track d) {
                <button (click)="toggleSlot(d, h)"
                        [style.background]="slots()[d]?.[h] ? 'var(--p)' : 'var(--bg2)'"
                        [style.opacity]="slots()[d]?.[h] ? '1' : '0.5'"
                        style="height:28px;border-radius:5px;border:none;cursor:pointer;transition:var(--tr)">
                  @if (slots()[d]?.[h]) {
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
                  }
                </button>
              }
            }
          </div>
          <div style="margin-top:14px;display:flex;gap:12px;font-size:12px;color:var(--t2)">
            <div style="display:flex;gap:5px;align-items:center"><div style="width:14px;height:14px;border-radius:4px;background:var(--p)"></div> {{ i18n.t('provider.agenda.available') }}</div>
            <div style="display:flex;gap:5px;align-items:center"><div style="width:14px;height:14px;border-radius:4px;background:var(--bg2);border:1px solid var(--bo)"></div> {{ i18n.t('provider.agenda.unavailable') }}</div>
          </div>
        </div>
      }

      <!-- PROMOS TAB -->
      @if (tab === 'promos') {
        @if (promoForm()) {
          <div class="card" style="padding:20px">
            <div style="font-weight:800;font-size:16px;margin-bottom:16px">{{ promoForm()!.id ? i18n.t('provider.promo.edit_title') : i18n.t('provider.promo.new_title') }}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="field" style="grid-column:1/-1"><label>{{ i18n.t('provider.promo.label') }}</label><input type="text" [(ngModel)]="promoForm()!.title" /></div>
              <div class="field" style="grid-column:1/-1"><label>{{ i18n.t('provider.promo.service') }}</label>
                <select [(ngModel)]="promoForm()!.serviceId">
                  <option value="">{{ i18n.t('provider.promo.select_svc') }}</option>
                  @for (s of services(); track s.id) { <option [value]="s.id">{{ s.name }} — R$ {{ s.price }}</option> }
                </select>
              </div>
              <div class="field"><label>{{ i18n.t('provider.promo.discount') }}</label><input type="number" min="1" max="99" [(ngModel)]="promoForm()!.discountPct" /></div>
              <div class="field"><label>{{ i18n.t('provider.promo.valid') }}</label><input type="date" [(ngModel)]="promoForm()!.endsAt" /></div>
              <div class="field" style="grid-column:1/-1"><label>{{ i18n.t('provider.promo.desc') }}</label><textarea [(ngModel)]="promoForm()!.description"></textarea></div>
              @if (promoForm()!.serviceId && promoForm()!.discountPct) {
                <div style="grid-column:1/-1;background:var(--px);border-radius:var(--rs);padding:10px 14px">
                  <div style="font-size:12px;color:var(--t2)">{{ i18n.t('provider.promo.preview') }}</div>
                  @if (promoPreview()) {
                    <div style="display:flex;gap:10px;align-items:center;margin-top:4px">
                      <span style="font-size:13px;text-decoration:line-through;color:var(--t3)">R$ {{ promoPreview()!.original }}</span>
                      <span style="font-size:18px;font-weight:800;color:var(--re)">R$ {{ promoPreview()!.final }}</span>
                      <span class="badge badge-promo">-{{ promoForm()!.discountPct }}% OFF</span>
                    </div>
                  }
                </div>
              }
            </div>
            @if (promoError()) { <div style="color:var(--re);font-size:12px;margin-top:6px">{{ promoError() }}</div> }
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
              <button class="btn btn-g" (click)="promoForm.set(null);promoError.set('')">{{ i18n.t('common.cancel') }}</button>
              <button class="btn btn-p" (click)="savePromo()">{{ i18n.t('provider.promo.publish') }}</button>
            </div>
          </div>
        } @else {
          <div style="display:flex;flex-direction:column;gap:10px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div><div style="font-weight:700;font-size:15px">{{ i18n.t('provider.promo.title') }}</div><div style="font-size:12px;color:var(--t3)">{{ promos().filter(p => p.active).length }} {{ i18n.t('provider.promo.active') }}</div></div>
              <button class="btn btn-p" (click)="promoForm.set({ title:'', serviceId:'', discountPct:0, description:'', active:true })">{{ i18n.t('provider.promo.new') }}</button>
            </div>
            @for (p of promos(); track p.id) {
              <div class="card" style="padding:14px 16px;display:flex;gap:12px;align-items:center;transition:var(--tr)"
                   [style.opacity]="p.active ? '1' : '0.6'"
                   [style.border-left]="'4px solid ' + (p.active ? 'var(--re)' : 'var(--bo)')">
                <div style="flex:1">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
                    <span style="font-weight:700;font-size:14px">{{ p.title }}</span>
                    <span class="badge" [class]="p.active ? 'badge-promo' : 'badge-g'">{{ p.active ? '-' + p.discountPct + '% ON' : 'OFF' }}</span>
                  </div>
                  @if (p.endsAt) { <div style="font-size:11px;color:var(--t3)">{{ i18n.t('provider.promo.valid') }} {{ p.endsAt }}</div> }
                </div>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-g" style="padding:6px 12px;font-size:12px" (click)="togglePromo(p)">{{ p.active ? i18n.t('provider.promo.pause') : i18n.t('provider.promo.activate') }}</button>
                  <button class="btn btn-g" style="padding:6px 12px;font-size:12px" (click)="promoForm.set({...p})">{{ i18n.t('common.edit') }}</button>
                  <button class="btn btn-danger" style="padding:6px 12px;font-size:12px" (click)="deletePromo(p.id!)">×</button>
                </div>
              </div>
            }
            @if (promos().length === 0) {
              <div class="card" style="padding:40px;text-align:center;color:var(--t3)">
                <div style="font-size:32px;margin-bottom:8px">🏷</div>
                <div style="font-weight:600">{{ i18n.t('provider.promo.empty') }}</div>
                <div style="font-size:13px;margin-top:4px">{{ i18n.t('provider.promo.empty_sub') }}</div>
              </div>
            }
          </div>
        }
      }

      <!-- POSTS TAB -->
      @if (tab === 'posts') {
        <div class="card" style="padding:16px;margin-bottom:6px">
          <div style="display:flex;gap:10px;margin-bottom:12px">
            <app-avatar [initials]="initials" [color]="color" [size]="38" />
            <textarea [(ngModel)]="postText" [placeholder]="i18n.t('provider.post.placeholder', { name: firstName })"
                      (input)="showPostForm = !!postText.trim()"
                      style="flex:1;border:1.5px solid var(--bo);border-radius:10px;padding:9px 12px;font-size:14px;background:var(--bg);outline:none;resize:none;min-height:72px;transition:var(--tr);color:var(--t)"
                      (focus)="$any($event.target).style.borderColor='var(--p)'" (blur)="$any($event.target).style.borderColor='var(--bo)'"></textarea>
          </div>
          @if (showPostForm) {
            <!-- Media row -->
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
              <!-- Image upload -->
              <label style="display:flex;align-items:center;gap:6px;padding:7px 14px;border:1.5px dashed var(--bo);border-radius:8px;cursor:pointer;font-size:12px;color:var(--t2);transition:var(--tr)"
                     (mouseenter)="$any($event.currentTarget).style.borderColor='var(--p)'" (mouseleave)="$any($event.currentTarget).style.borderColor='var(--bo)'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                </svg>
                {{ postImageFile ? postImageFile.name.slice(0,20) : i18n.t('provider.post.add_image') }}
                <input type="file" accept="image/*" style="display:none" (change)="onPostImageChange($event)" />
              </label>

              @if (postImageFile) {
                <button (click)="postImageFile = null; postImagePreview = null"
                        style="padding:4px 8px;border-radius:6px;border:none;background:var(--bg2);color:var(--t3);cursor:pointer;font-size:11px">×</button>
              }

              <!-- Or divider -->
              @if (!postImageFile) {
                <span style="font-size:11px;color:var(--t3)">{{ i18n.t('provider.post.or') }}</span>
                <!-- YouTube URL -->
                <input [(ngModel)]="postVideoUrl" [placeholder]="i18n.t('provider.post.youtube')"
                       style="flex:1;min-width:180px;border:1.5px solid var(--bo);border-radius:8px;padding:7px 12px;font-size:12px;background:var(--bg);outline:none;color:var(--t)" />
              }
            </div>

            <!-- Image preview -->
            @if (postImagePreview) {
              <div style="margin-bottom:10px;border-radius:8px;overflow:hidden;max-height:200px">
                <img [src]="postImagePreview" style="width:100%;object-fit:cover;display:block" />
              </div>
            }

            <div style="display:flex;gap:10px;margin-bottom:10px">
              <div class="field" style="width:140px;margin-bottom:0"><label>{{ i18n.t('provider.post.category') }}</label>
                <select [(ngModel)]="postCat">
                  @for (c of cats; track c.id) { <option [value]="c.id">{{ c.icon }} {{ i18n.t('cat.' + c.id) }}</option> }
                </select>
              </div>
            </div>
          }
          @if (postError()) { <div style="color:var(--re);font-size:12px;margin-bottom:6px">{{ postError() }}</div> }
          <div style="display:flex;gap:8px;justify-content:flex-end;align-items:center">
            @if (postUploading()) { <span style="font-size:12px;color:var(--t3)">{{ i18n.t('provider.post.uploading') }}…</span> }
            @if (showPostForm) { <button class="btn btn-g" (click)="clearPost()">{{ i18n.t('common.cancel') }}</button> }
            <button class="btn btn-p" (click)="publishPost()" [style.opacity]="postText.trim() && !postUploading() ? '1' : '0.5'">{{ i18n.t('provider.post.publish') }}</button>
          </div>
        </div>
        <div style="font-weight:700;font-size:15px;margin-bottom:10px">{{ i18n.t('provider.post.my') }} ({{ myPosts().length }})</div>
        @for (p of myPosts(); track p.id) {
          <div class="card" style="margin-bottom:8px;overflow:hidden">
            @if (p.imageUrl) {
              <img [src]="API_BASE + p.imageUrl" style="width:100%;max-height:240px;object-fit:cover;display:block" />
            }
            @if (!p.imageUrl && p.videoUrl) {
              <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden">
                <iframe [src]="safeEmbed(p.videoUrl)" frameborder="0" allowfullscreen
                        style="position:absolute;top:0;left:0;width:100%;height:100%"></iframe>
              </div>
            }
            <div style="padding:14px 16px">
              <p style="font-size:13px;line-height:1.6;color:var(--t);margin-bottom:10px">{{ p.text }}</p>
              <div style="display:flex;gap:10px">
                <span style="font-size:12px;color:var(--t3)">❤️ {{ p.likesCount }} {{ i18n.t('provider.post.likes') }}</span>
                <span style="font-size:12px;color:var(--t3)">💬 {{ p.comments?.length || 0 }} {{ i18n.t('provider.post.comments') }}</span>
                <span style="font-size:12px;color:var(--t3)">{{ formatPostDate(p.createdAt) }}</span>
              </div>
            </div>
          </div>
        }
        @if (myPosts().length === 0) {
          <div class="card" style="padding:40px;text-align:center;color:var(--t3)">
            <div style="font-size:32px;margin-bottom:8px">📝</div>
            <div style="font-weight:600">{{ i18n.t('provider.post.empty') }}</div>
          </div>
        }
      }
    </div>
  `,
})
export class ProviderComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  router = inject(Router);
  i18n = inject(TranslationService);
  sanitizer = inject(DomSanitizer);

  tabs = [
    { id: 'profile',   key: 'provider.tab.profile',   icon: '👤' },
    { id: 'services',  key: 'provider.tab.services',  icon: '🛠' },
    { id: 'stores',    key: 'provider.tab.stores',    icon: '🏪' },
    { id: 'agenda',    key: 'provider.tab.agenda',    icon: '📅' },
    { id: 'promos',    key: 'provider.tab.promos',    icon: '🏷' },
    { id: 'posts',     key: 'provider.tab.posts',     icon: '📝' },
  ];
  cats = CATEGORIES.filter(c => c.id !== 'all');
  tab = 'profile';
  weekDays = DAYS;
  hours = HOURS;

  profile = signal<Partial<ProviderProfile & { name: string }>>({ name: this.auth.user()?.name || '', role: '', category: 'reform', bio: '', phone: '', city: '', rating: 0, reviewsCount: 0, jobsCount: 0 });
  pf: any = { ...this.profile() };
  savedPf = signal(false);
  savePfError = signal('');

  services = signal<Partial<Service>[]>([]);
  svcForm = signal<Partial<Service> | null>(null);
  svcError = signal('');

  promos = signal<Partial<Promo>[]>([]);
  promoForm = signal<Partial<Promo> | null>(null);
  promoError = signal('');

  slots = signal<Record<string, Record<string, boolean>>>(buildSlots());

  coverUploading = signal(false);
  coverError = signal('');

  stores = signal<Store[]>([]);
  storeForm = signal<Partial<Store> | null>(null);
  storeError = signal('');
  storeCoverUploading = signal<string | null>(null);

  myPosts = signal<any[]>([]);
  postText = '';
  postImgLabel = '';
  postVideoUrl = '';
  postCat = 'reform';
  postImageFile: File | null = null;
  postImagePreview: string | null = null;
  showPostForm = false;
  postError = signal('');
  postUploading = signal(false);

  API_BASE = API_BASE;

  get initials() { return this.auth.user()?.avatarInitials || this.auth.user()?.name?.slice(0, 2).toUpperCase() || 'VC'; }
  get firstName() { return this.auth.user()?.name?.split(' ')[0] || 'Você'; }
  get color() { return getInitialsColor(this.initials); }

  catIcon(id?: string) { return CATEGORIES.find(c => c.id === id)?.icon || ''; }
  catName(id?: string) { return CATEGORIES.find(c => c.id === id)?.label || ''; }

  storePlanLabel() {
    const plan = this.auth.user()?.plan || 'free';
    if (plan === 'master') return this.i18n.t('provider.store.limit_master');
    if (plan === 'pro') return this.i18n.t('provider.store.limit_pro');
    return this.i18n.t('provider.store.limit_free');
  }

  promoPreview() {
    const f = this.promoForm();
    if (!f?.serviceId || !f?.discountPct) return null;
    const svc = this.services().find(s => s.id === f.serviceId);
    if (!svc) return null;
    return { original: svc.price, final: Math.round((svc.price || 0) * (1 - (f.discountPct || 0) / 100)) };
  }

  ngOnInit() {
    this.api.getMyProfile().subscribe({ next: p => { if (p) { this.profile.set({ ...p, name: p.user?.name || this.auth.user()?.name || '' }); this.pf = { ...this.profile() }; } }, error: () => {} });
    this.api.getMyServices().subscribe({ next: s => this.services.set(s), error: () => {} });
    this.api.getMyPromos().subscribe({ next: p => this.promos.set(p), error: () => {} });
    this.api.getMyStores().subscribe({ next: s => this.stores.set(s), error: () => {} });
    this.api.getMyPosts().subscribe({ next: p => this.myPosts.set(p), error: () => {} });
  }

  resetPf() { this.pf = { ...this.profile() }; }

  saveProfile() {
    this.savePfError.set('');
    this.api.updateMyProfile(this.pf).subscribe({
      next: p => { this.profile.set({ ...p, name: p.user?.name || this.pf.name }); this.savedPf.set(true); setTimeout(() => this.savedPf.set(false), 2000); },
      error: () => this.savePfError.set('Erro ao salvar perfil. Tente novamente.'),
    });
  }

  saveService() {
    const f = this.svcForm();
    if (!f || !f.name || !f.price) return;
    this.svcError.set('');
    if (f.id) {
      this.api.updateService(f.id, f).subscribe({
        next: s => { this.services.update(ss => ss.map(x => x.id === s.id ? s : x)); this.svcForm.set(null); },
        error: () => this.svcError.set('Erro ao atualizar serviço.'),
      });
    } else {
      this.api.createService(f).subscribe({
        next: s => { this.services.update(ss => [...ss, s]); this.svcForm.set(null); },
        error: () => this.svcError.set('Erro ao criar serviço. Certifique-se de ter um perfil de prestador salvo.'),
      });
    }
  }

  deleteService(id: string) {
    this.api.deleteService(id).subscribe({
      next: () => this.services.update(ss => ss.filter(s => s.id !== id)),
      error: () => {},
    });
  }

  toggleSlot(day: string, hour: string) {
    this.slots.update(s => ({ ...s, [day]: { ...s[day], [hour]: !s[day][hour] } }));
  }

  savePromo() {
    const f = this.promoForm();
    if (!f || !f.title || !f.serviceId || !f.discountPct) return;
    this.promoError.set('');
    if (f.id) {
      this.api.updatePromo(f.id, f).subscribe({
        next: p => { this.promos.update(ps => ps.map(x => x.id === p.id ? p : x)); this.promoForm.set(null); },
        error: () => this.promoError.set('Erro ao atualizar promoção.'),
      });
    } else {
      this.api.createPromo(f).subscribe({
        next: p => { this.promos.update(ps => [...ps, p]); this.promoForm.set(null); },
        error: () => this.promoError.set('Erro ao criar promoção.'),
      });
    }
  }

  togglePromo(p: any) {
    const updated = { ...p, active: !p.active };
    this.promos.update(ps => ps.map(x => x.id === p.id ? updated : x));
    this.api.updatePromo(p.id, updated).subscribe({
      error: () => this.promos.update(ps => ps.map(x => x.id === p.id ? p : x)),
    });
  }

  deletePromo(id: string) {
    this.api.deletePromo(id).subscribe({
      next: () => this.promos.update(ps => ps.filter(p => p.id !== id)),
      error: () => {},
    });
  }

  saveStore() {
    const f = this.storeForm();
    if (!f || !f.name?.trim()) return;
    this.storeError.set('');
    if (f.id) {
      this.api.updateStore(f.id, f).subscribe({
        next: s => { this.stores.update(ss => ss.map(x => x.id === s.id ? s : x)); this.storeForm.set(null); },
        error: (e) => this.storeError.set(e.error?.message || 'Erro ao salvar loja.'),
      });
    } else {
      this.api.createStore(f).subscribe({
        next: s => { this.stores.update(ss => [...ss, s]); this.storeForm.set(null); },
        error: (e) => this.storeError.set(e.error?.message || 'Erro ao criar loja. Verifique seu plano.'),
      });
    }
  }

  deleteStore(id: string) {
    this.api.deleteStore(id).subscribe({
      next: () => this.stores.update(ss => ss.filter(s => s.id !== id)),
      error: () => {},
    });
  }

  onStoreCoverChange(event: Event, storeId: string) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.storeCoverUploading.set(storeId);
    this.api.uploadStoreCover(storeId, file).subscribe({
      next: updated => { this.stores.update(ss => ss.map(s => s.id === storeId ? updated : s)); this.storeCoverUploading.set(null); },
      error: () => this.storeCoverUploading.set(null),
    });
  }

  onCoverChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.coverError.set('');
    this.coverUploading.set(true);
    this.api.uploadProviderCover(file).subscribe({
      next: ({ coverUrl }) => {
        this.profile.update(p => ({ ...p, coverUrl }));
        this.coverUploading.set(false);
      },
      error: () => {
        this.coverError.set(this.i18n.t('provider.cover.error'));
        this.coverUploading.set(false);
      },
    });
  }

  onPostImageChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.postImageFile = file;
    this.postVideoUrl = '';
    const reader = new FileReader();
    reader.onload = e => this.postImagePreview = e.target?.result as string;
    reader.readAsDataURL(file);
    this.showPostForm = true;
  }

  publishPost() {
    if (!this.postText.trim()) return;
    this.postError.set('');
    const data = { type: 'provider' as const, text: this.postText, category: this.postCat };
    this.postUploading.set(true);
    this.api.createPost(data).subscribe({
      next: post => {
        const afterMedia = (finalPost: any) => {
          this.myPosts.update(ps => [finalPost, ...ps]);
          this.clearPost();
          this.postUploading.set(false);
        };
        if (this.postImageFile) {
          this.api.uploadPostImage(post.id, this.postImageFile).subscribe({
            next: updated => afterMedia(updated),
            error: () => { afterMedia(post); this.postError.set('Post publicado mas imagem falhou.'); },
          });
        } else if (this.postVideoUrl.trim()) {
          this.api.setPostVideo(post.id, this.postVideoUrl.trim()).subscribe({
            next: updated => afterMedia(updated),
            error: () => { afterMedia(post); this.postError.set('Post publicado mas vídeo falhou.'); },
          });
        } else {
          afterMedia(post);
        }
      },
      error: () => { this.postError.set('Erro ao publicar post.'); this.postUploading.set(false); },
    });
  }

  safeEmbed(url: string): SafeResourceUrl {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const embedUrl = match ? `https://www.youtube.com/embed/${match[1]}` : url;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  formatPostDate(createdAt: string) {
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return createdAt;
    const diff = Date.now() - d.getTime();
    if (diff < 3600000) return Math.max(1, Math.floor(diff / 60000)) + 'min';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
    return Math.floor(diff / 86400000) + 'd';
  }

  clearPost() { this.postText = ''; this.postImgLabel = ''; this.postVideoUrl = ''; this.postCat = 'reform'; this.postImageFile = null; this.postImagePreview = null; this.showPostForm = false; }
}
