import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/components/avatar.component';
import { CATEGORIES, Service, Promo, ProviderProfile, getInitialsColor } from '../../shared/models';

const HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
const DAYS = ['Seg','Ter','Qua','Qui','Sex','Sáb'];

function buildSlots() {
  const s: Record<string, Record<string, boolean>> = {};
  DAYS.forEach(d => { s[d] = {}; HOURS.forEach(h => { s[d][h] = h >= '09:00' && h <= '17:00'; }); });
  return s;
}

@Component({
  selector: 'app-provider',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
  template: `
    <div style="display:flex;flex-direction:column;gap:14px">

      <!-- Header card -->
      <div style="display:flex;align-items:center;gap:12px;padding:14px 18px;
        background:linear-gradient(135deg,var(--p),var(--ac));border-radius:var(--r);color:white">
        <app-avatar [initials]="initials" color="rgba(255,255,255,0.25)" [size]="52" [border]="false" />
        <div>
          <div style="font-weight:800;font-size:18px">{{ profile().name }}</div>
          <div style="opacity:0.8;font-size:13px">{{ profile().role || 'Prestador de serviços' }}</div>
          <div style="display:flex;gap:12px;margin-top:5px">
            <span style="font-size:12px;opacity:0.9">⭐ {{ profile().rating || '—' }}</span>
            <span style="font-size:12px;opacity:0.9">💬 {{ profile().reviewsCount || 0 }} reviews</span>
            <span style="font-size:12px;opacity:0.9">✅ {{ profile().jobsCount || 0 }} jobs</span>
          </div>
        </div>
        <div style="margin-left:auto;background:rgba(255,255,255,0.18);padding:6px 14px;border-radius:99px;font-size:12px;font-weight:600">Modo Prestador</div>
      </div>

      <!-- Tab bar -->
      <div style="display:flex;gap:4px;overflow-x:auto;background:var(--ca);border-radius:var(--r);padding:6px;border:1px solid var(--bo);box-shadow:var(--sh)">
        @for (t of tabs; track t.id) {
          <button (click)="tab = t.id"
                  [style.background]="tab === t.id ? 'var(--p)' : 'transparent'"
                  [style.color]="tab === t.id ? 'white' : 'var(--t2)'"
                  style="flex:0 0 auto;padding:8px 16px;border-radius:var(--rs);border:none;font-weight:600;font-size:13px;cursor:pointer;transition:var(--tr);display:flex;align-items:center;gap:6px;white-space:nowrap">
            {{ t.icon }} {{ t.label }}
          </button>
        }
      </div>

      <!-- PROFILE TAB -->
      @if (tab === 'profile') {
        <div class="card" style="padding:20px">
          <div style="font-weight:800;font-size:16px;margin-bottom:16px">Editar perfil</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="field" style="grid-column:1/-1"><label>Nome completo</label><input type="text" [(ngModel)]="pf.name" /></div>
            <div class="field"><label>Especialidade / Cargo</label><input type="text" [(ngModel)]="pf.role" /></div>
            <div class="field"><label>Categoria principal</label>
              <select [(ngModel)]="pf.category">
                @for (c of cats; track c.id) { <option [value]="c.id">{{ c.icon }} {{ c.label }}</option> }
              </select>
            </div>
            <div class="field"><label>Telefone / WhatsApp</label><input type="text" [(ngModel)]="pf.phone" /></div>
            <div class="field"><label>Cidade</label><input type="text" [(ngModel)]="pf.city" /></div>
            <div class="field" style="grid-column:1/-1"><label>Bio / Sobre você</label><textarea [(ngModel)]="pf.bio" style="min-height:90px"></textarea></div>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
            <button class="btn btn-g" (click)="resetPf()">Cancelar</button>
            <button class="btn btn-p" (click)="saveProfile()">{{ savedPf() ? '✓ Salvo!' : 'Salvar alterações' }}</button>
          </div>
        </div>
      }

      <!-- SERVICES TAB -->
      @if (tab === 'services') {
        @if (svcForm()) {
          <div class="card" style="padding:20px">
            <div style="font-weight:800;font-size:16px;margin-bottom:16px">{{ svcForm()!.id ? 'Editar serviço' : 'Novo serviço' }}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="field" style="grid-column:1/-1"><label>Nome do serviço *</label><input type="text" [(ngModel)]="svcForm()!.name" placeholder="Ex: Projeto Residencial" /></div>
              <div class="field"><label>Preço (R$) *</label><input type="number" [(ngModel)]="svcForm()!.price" placeholder="0" /></div>
              <div class="field"><label>Duração (minutos)</label><input type="number" [(ngModel)]="svcForm()!.duration" placeholder="60" /></div>
              <div class="field"><label>Categoria</label>
                <select [(ngModel)]="svcForm()!.category">
                  @for (c of cats; track c.id) { <option [value]="c.id">{{ c.icon }} {{ c.label }}</option> }
                </select>
              </div>
              <div class="field" style="grid-column:1/-1"><label>Descrição</label><textarea [(ngModel)]="svcForm()!.description" placeholder="Descreva o serviço..."></textarea></div>
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
              <button class="btn btn-g" (click)="svcForm.set(null)">Cancelar</button>
              <button class="btn btn-p" (click)="saveService()">Salvar serviço</button>
            </div>
          </div>
        } @else {
          <div style="display:flex;flex-direction:column;gap:10px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div><div style="font-weight:700;font-size:15px">Meus Serviços</div><div style="font-size:12px;color:var(--t3)">{{ services().length }} serviços cadastrados</div></div>
              <button class="btn btn-p" (click)="svcForm.set({ name:'', price:0, duration:60, category:'reform', description:'' })">+ Novo serviço</button>
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
                  <button class="btn btn-g" style="padding:6px 12px;font-size:12px" (click)="svcForm.set({...s})">Editar</button>
                  <button class="btn btn-danger" style="padding:6px 12px;font-size:12px" (click)="deleteService(s.id!)">Excluir</button>
                </div>
              </div>
            }
            @if (services().length === 0) {
              <div class="card" style="padding:40px;text-align:center;color:var(--t3)">
                <div style="font-size:32px;margin-bottom:8px">🛠</div>
                <div style="font-weight:600">Nenhum serviço cadastrado</div>
                <div style="font-size:13px;margin-top:4px">Adicione seus serviços para aparecer no feed</div>
              </div>
            }
          </div>
        }
      }

      <!-- AGENDA TAB -->
      @if (tab === 'agenda') {
        <div class="card" style="padding:20px;overflow-x:auto">
          <div style="font-weight:700;font-size:15px;margin-bottom:4px">Disponibilidade semanal</div>
          <div style="font-size:12px;color:var(--t3);margin-bottom:16px">Clique nos horários para ativar/desativar sua disponibilidade</div>
          <div style="display:grid;gap:3px;min-width:500px" [style.grid-template-columns]="'60px repeat(' + weekDays.length + ',1fr)'">
            <div></div>
            @for (d of weekDays; track d) {
              <div style="text-align:center;font-weight:700;font-size:11px;color:var(--t2);padding:4px 0;background:var(--bg2);border-radius:6px">{{ d }}</div>
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
            <div style="display:flex;gap:5px;align-items:center"><div style="width:14px;height:14px;border-radius:4px;background:var(--p)"></div> Disponível</div>
            <div style="display:flex;gap:5px;align-items:center"><div style="width:14px;height:14px;border-radius:4px;background:var(--bg2);border:1px solid var(--bo)"></div> Indisponível</div>
          </div>
        </div>
      }

      <!-- PROMOS TAB -->
      @if (tab === 'promos') {
        @if (promoForm()) {
          <div class="card" style="padding:20px">
            <div style="font-weight:800;font-size:16px;margin-bottom:16px">{{ promoForm()!.id ? 'Editar promoção' : 'Nova promoção' }}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="field" style="grid-column:1/-1"><label>Título da promoção *</label><input type="text" [(ngModel)]="promoForm()!.title" placeholder="Ex: Promoção de Verão" /></div>
              <div class="field" style="grid-column:1/-1"><label>Serviço *</label>
                <select [(ngModel)]="promoForm()!.serviceId">
                  <option value="">Selecione um serviço</option>
                  @for (s of services(); track s.id) { <option [value]="s.id">{{ s.name }} — R$ {{ s.price }}</option> }
                </select>
              </div>
              <div class="field"><label>Desconto (%) *</label><input type="number" min="1" max="99" [(ngModel)]="promoForm()!.discountPct" placeholder="Ex: 20" /></div>
              <div class="field"><label>Validade até</label><input type="date" [(ngModel)]="promoForm()!.endsAt" /></div>
              <div class="field" style="grid-column:1/-1"><label>Descrição</label><textarea [(ngModel)]="promoForm()!.description" placeholder="Descreva sua promoção..."></textarea></div>
              @if (promoForm()!.serviceId && promoForm()!.discountPct) {
                <div style="grid-column:1/-1;background:var(--px);border-radius:var(--rs);padding:10px 14px">
                  <div style="font-size:12px;color:var(--t2)">Preview do preço:</div>
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
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
              <button class="btn btn-g" (click)="promoForm.set(null)">Cancelar</button>
              <button class="btn btn-p" (click)="savePromo()">Publicar promoção</button>
            </div>
          </div>
        } @else {
          <div style="display:flex;flex-direction:column;gap:10px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div><div style="font-weight:700;font-size:15px">Minhas Promoções</div><div style="font-size:12px;color:var(--t3)">{{ promos().filter(p => p.active).length }} ativas</div></div>
              <button class="btn btn-p" (click)="promoForm.set({ title:'', serviceId:'', discountPct:0, description:'', active:true })">+ Nova promoção</button>
            </div>
            @for (p of promos(); track p.id) {
              <div class="card" style="padding:14px 16px;display:flex;gap:12px;align-items:center;transition:var(--tr)"
                   [style.opacity]="p.active ? '1' : '0.6'"
                   [style.border-left]="'4px solid ' + (p.active ? 'var(--re)' : 'var(--bo)')">
                <div style="flex:1">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
                    <span style="font-weight:700;font-size:14px">{{ p.title }}</span>
                    <span class="badge" [class]="p.active ? 'badge-promo' : 'badge-g'">{{ p.active ? '-' + p.discountPct + '% ATIVA' : 'INATIVA' }}</span>
                  </div>
                  @if (p.endsAt) { <div style="font-size:11px;color:var(--t3)">Válido até {{ p.endsAt }}</div> }
                </div>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-g" style="padding:6px 12px;font-size:12px" (click)="togglePromo(p)">{{ p.active ? 'Pausar' : 'Ativar' }}</button>
                  <button class="btn btn-g" style="padding:6px 12px;font-size:12px" (click)="promoForm.set({...p})">Editar</button>
                  <button class="btn btn-danger" style="padding:6px 12px;font-size:12px" (click)="deletePromo(p.id!)">×</button>
                </div>
              </div>
            }
            @if (promos().length === 0) {
              <div class="card" style="padding:40px;text-align:center;color:var(--t3)">
                <div style="font-size:32px;margin-bottom:8px">🏷</div>
                <div style="font-weight:600">Nenhuma promoção ainda</div>
                <div style="font-size:13px;margin-top:4px">Crie promoções para atrair mais clientes</div>
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
            <textarea [(ngModel)]="postText" [placeholder]="'O que você quer compartilhar, ' + firstName + '?'"
                      (input)="showPostForm = !!postText.trim()"
                      style="flex:1;border:1.5px solid var(--bo);border-radius:10px;padding:9px 12px;font-size:14px;background:var(--bg);outline:none;resize:none;min-height:72px;transition:var(--tr);color:var(--t)"
                      (focus)="$any($event.target).style.borderColor='var(--p)'" (blur)="$any($event.target).style.borderColor='var(--bo)'"></textarea>
          </div>
          @if (showPostForm) {
            <div style="display:flex;gap:10px;margin-bottom:10px">
              <div class="field" style="flex:1;margin-bottom:0"><label>Legenda da imagem (opcional)</label><input type="text" [(ngModel)]="postImgLabel" placeholder="Ex: Projeto finalizado em SP" /></div>
              <div class="field" style="width:140px;margin-bottom:0"><label>Categoria</label>
                <select [(ngModel)]="postCat">
                  @for (c of cats; track c.id) { <option [value]="c.id">{{ c.icon }} {{ c.label }}</option> }
                </select>
              </div>
            </div>
          }
          <div style="display:flex;gap:8px;justify-content:flex-end">
            @if (showPostForm) { <button class="btn btn-g" (click)="clearPost()">Cancelar</button> }
            <button class="btn btn-p" (click)="publishPost()" [style.opacity]="postText.trim() ? '1' : '0.5'">Publicar</button>
          </div>
        </div>
        <div style="font-weight:700;font-size:15px;margin-bottom:10px">Minhas postagens ({{ myPosts().length }})</div>
        @for (p of myPosts(); track p.id) {
          <div class="card" style="padding:14px 16px;margin-bottom:8px">
            <p style="font-size:13px;line-height:1.6;color:var(--t);margin-bottom:10px">{{ p.text }}</p>
            <div style="display:flex;gap:10px">
              <span style="font-size:12px;color:var(--t3)">❤️ {{ p.likesCount }} curtidas</span>
              <span style="font-size:12px;color:var(--t3)">💬 {{ p.comments?.length || 0 }} comentários</span>
              <span style="font-size:12px;color:var(--t3)">{{ p.createdAt }}</span>
            </div>
          </div>
        }
        @if (myPosts().length === 0) {
          <div class="card" style="padding:40px;text-align:center;color:var(--t3)">
            <div style="font-size:32px;margin-bottom:8px">📝</div>
            <div style="font-weight:600">Nenhuma postagem ainda</div>
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

  tabs = [
    { id: 'profile', label: 'Perfil', icon: '👤' },
    { id: 'services', label: 'Serviços', icon: '🛠' },
    { id: 'agenda', label: 'Agenda', icon: '📅' },
    { id: 'promos', label: 'Promoções', icon: '🏷' },
    { id: 'posts', label: 'Postagens', icon: '📝' },
  ];
  cats = CATEGORIES.filter(c => c.id !== 'all');
  tab = 'profile';
  weekDays = DAYS;
  hours = HOURS;

  profile = signal<Partial<ProviderProfile & { name: string }>>({ name: this.auth.user()?.name || '', role: '', category: 'reform', bio: '', phone: '', city: '', rating: 0, reviewsCount: 0, jobsCount: 0 });
  pf: any = { ...this.profile() };
  savedPf = signal(false);

  services = signal<Partial<Service>[]>([]);
  svcForm = signal<Partial<Service> | null>(null);

  promos = signal<Partial<Promo>[]>([]);
  promoForm = signal<Partial<Promo> | null>(null);

  slots = signal<Record<string, Record<string, boolean>>>(buildSlots());

  myPosts = signal<any[]>([]);
  postText = '';
  postImgLabel = '';
  postCat = 'reform';
  showPostForm = false;

  get initials() { return this.auth.user()?.avatarInitials || this.auth.user()?.name?.slice(0, 2).toUpperCase() || 'VC'; }
  get firstName() { return this.auth.user()?.name?.split(' ')[0] || 'Você'; }
  get color() { return getInitialsColor(this.initials); }

  catIcon(id?: string) { return CATEGORIES.find(c => c.id === id)?.icon || ''; }
  catName(id?: string) { return CATEGORIES.find(c => c.id === id)?.label || ''; }

  promoPreview() {
    const f = this.promoForm();
    if (!f?.serviceId || !f?.discountPct) return null;
    const svc = this.services().find(s => s.id === f.serviceId);
    if (!svc) return null;
    return { original: svc.price, final: Math.round((svc.price || 0) * (1 - (f.discountPct || 0) / 100)) };
  }

  ngOnInit() {
    this.api.getMyProfile().subscribe({ next: p => { this.profile.set({ ...p, name: p.user?.name || this.auth.user()?.name || '' }); this.pf = { ...this.profile() }; }, error: () => {} });
    this.api.getMyServices().subscribe({ next: s => this.services.set(s), error: () => {} });
    this.api.getMyPromos().subscribe({ next: p => this.promos.set(p), error: () => {} });
  }

  resetPf() { this.pf = { ...this.profile() }; }

  saveProfile() {
    this.api.updateMyProfile(this.pf).subscribe({ next: p => { this.profile.set({ ...p, name: p.user?.name || this.pf.name }); this.savedPf.set(true); setTimeout(() => this.savedPf.set(false), 2000); }, error: () => { this.savedPf.set(true); setTimeout(() => this.savedPf.set(false), 2000); } });
  }

  saveService() {
    const f = this.svcForm();
    if (!f || !f.name || !f.price) return;
    if (f.id) {
      this.api.updateService(f.id, f).subscribe({ next: s => { this.services.update(ss => ss.map(x => x.id === s.id ? s : x)); this.svcForm.set(null); }, error: () => { this.services.update(ss => ss.map(x => x.id === f.id ? f : x)); this.svcForm.set(null); } });
    } else {
      this.api.createService(f).subscribe({ next: s => { this.services.update(ss => [...ss, s]); this.svcForm.set(null); }, error: () => { this.services.update(ss => [...ss, { ...f, id: Date.now().toString() }]); this.svcForm.set(null); } });
    }
  }

  deleteService(id: string) {
    this.api.deleteService(id).subscribe({ next: () => {}, error: () => {} });
    this.services.update(ss => ss.filter(s => s.id !== id));
  }

  toggleSlot(day: string, hour: string) {
    this.slots.update(s => ({ ...s, [day]: { ...s[day], [hour]: !s[day][hour] } }));
  }

  savePromo() {
    const f = this.promoForm();
    if (!f || !f.title || !f.serviceId || !f.discountPct) return;
    if (f.id) {
      this.api.updatePromo(f.id, f).subscribe({ next: p => { this.promos.update(ps => ps.map(x => x.id === p.id ? p : x)); this.promoForm.set(null); }, error: () => { this.promos.update(ps => ps.map(x => x.id === f.id ? f : x)); this.promoForm.set(null); } });
    } else {
      this.api.createPromo(f).subscribe({ next: p => { this.promos.update(ps => [...ps, p]); this.promoForm.set(null); }, error: () => { this.promos.update(ps => [...ps, { ...f, id: Date.now().toString(), active: true }]); this.promoForm.set(null); } });
    }
  }

  togglePromo(p: any) {
    const updated = { ...p, active: !p.active };
    this.api.updatePromo(p.id, updated).subscribe({ next: () => {}, error: () => {} });
    this.promos.update(ps => ps.map(x => x.id === p.id ? updated : x));
  }

  deletePromo(id: string) {
    this.api.deletePromo(id).subscribe({ next: () => {}, error: () => {} });
    this.promos.update(ps => ps.filter(p => p.id !== id));
  }

  publishPost() {
    if (!this.postText.trim()) return;
    const post = { type: 'provider', text: this.postText, imageLabel: this.postImgLabel || undefined, category: this.postCat, likesCount: 0, createdAt: 'agora', comments: [], author: { name: this.auth.user()?.name, avatarInitials: this.initials } };
    this.api.createPost(post as any).subscribe({ next: p => this.myPosts.update(ps => [p, ...ps]), error: () => this.myPosts.update(ps => [{ ...post, id: Date.now().toString() }, ...ps]) });
    this.clearPost();
  }

  clearPost() { this.postText = ''; this.postImgLabel = ''; this.postCat = 'reform'; this.showPostForm = false; }
}
