import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/components/avatar.component';
import { Store, ProviderProfile, ProviderStats, CATEGORIES, getInitialsColor } from '../../shared/models';

const API_BASE = 'http://localhost:3000';

@Component({
  selector: 'app-store-mgmt',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AvatarComponent],
  template: `
    <div style="display:flex;flex-direction:column;gap:14px">

      @if (loading()) {
        <div style="display:flex;align-items:center;justify-content:center;min-height:40vh">
          <svg class="spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--p)" stroke-width="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
          </svg>
        </div>
      } @else if (stores().length === 0 && !showCreate()) {
        <!-- Empty state -->
        <div class="card" style="padding:48px 24px;text-align:center">
          <div style="font-size:48px;margin-bottom:12px">🏪</div>
          <div style="font-weight:800;font-size:18px;margin-bottom:6px">Nenhuma loja ainda</div>
          <div style="font-size:13px;color:var(--t2);margin-bottom:20px">Crie a sua loja para gerir a equipa e os serviços num único lugar.</div>
          @if ((auth.user()?.plan || 'free') !== 'free') {
            <button class="btn btn-p" (click)="showCreate.set(true)">+ Criar loja</button>
          } @else {
            <a routerLink="/pricing" class="btn btn-p" style="text-decoration:none">Upgrade para criar loja</a>
          }
        </div>

      } @else if (showCreate()) {
        <!-- Create store form -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <button class="btn btn-g" style="padding:6px 12px;font-size:12px" (click)="showCreate.set(false)">← Voltar</button>
          <div style="font-weight:800;font-size:16px">Nova loja</div>
        </div>
        <div class="card" style="padding:20px">
          <div class="field"><label>Nome</label><input type="text" [(ngModel)]="newStore.name" placeholder="Ex: Salão Premium" /></div>
          <div class="field"><label>Descrição</label><textarea [(ngModel)]="newStore.description" style="min-height:72px" placeholder="Descreva a sua loja..."></textarea></div>
          <div class="field"><label>Categoria</label>
            <select [(ngModel)]="newStore.category">
              @for (c of cats; track c.id) { <option [value]="c.id">{{ c.icon }} {{ c.label }}</option> }
            </select>
          </div>
          @if (createError()) { <div style="color:var(--re);font-size:12px;margin-top:4px">{{ createError() }}</div> }
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
            <button class="btn btn-g" (click)="showCreate.set(false)">Cancelar</button>
            <button class="btn btn-p" (click)="createStore()">Criar loja</button>
          </div>
        </div>

      } @else if (stores().length > 1 && !activeStore()) {
        <!-- Multiple stores: pick one -->
        <div style="font-weight:800;font-size:16px;margin-bottom:4px">As minhas lojas</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          @for (s of stores(); track s.id) {
            <div class="card" style="overflow:hidden;cursor:pointer;border:1.5px solid var(--bo);transition:var(--tr)"
                 (click)="selectStore(s)"
                 (mouseenter)="$any($event.currentTarget).style.borderColor='var(--p)'"
                 (mouseleave)="$any($event.currentTarget).style.borderColor='var(--bo)'">
              <div style="height:80px;position:relative;overflow:hidden"
                   [style.background]="s.coverUrl ? 'var(--bg2)' : (s.backgroundColor || 'linear-gradient(135deg,var(--p),var(--ac))')">
                @if (s.coverUrl) { <img [src]="API_BASE + s.coverUrl" style="width:100%;height:100%;object-fit:cover;display:block" /> }
              </div>
              <div style="padding:12px 16px;display:flex;align-items:center;gap:10px">
                <div style="flex:1"><div style="font-weight:700;font-size:14px">{{ s.name }}</div>
                  <div style="font-size:11px;color:var(--t3)">{{ s.members?.length || 0 }} membros</div>
                </div>
                <span style="color:var(--p);font-size:12px;font-weight:600">Gerir →</span>
              </div>
            </div>
          }
          @if ((auth.user()?.plan || 'free') === 'master') {
            <button class="btn btn-g" (click)="showCreate.set(true)">+ Nova loja</button>
          }
        </div>

      } @else {
        <!-- Store management: tabs -->
        @if (stores().length > 1) {
          <button class="btn btn-g" style="align-self:flex-start;padding:6px 12px;font-size:12px" (click)="activeStore.set(null)">← Todas as lojas</button>
        }

        <!-- Store header -->
        <div style="position:relative;border-radius:var(--r);overflow:hidden;min-height:120px"
             [style.background]="currentStore()!.coverUrl ? 'var(--bg2)' : (currentStore()!.backgroundColor || 'linear-gradient(135deg,var(--p),var(--ac))')">
          @if (currentStore()!.coverUrl) {
            <img [src]="API_BASE + currentStore()!.coverUrl" style="width:100%;height:140px;object-fit:cover;display:block" />
          } @else {
            <div style="height:140px"></div>
          }
          @if (currentStore()!.logoUrl) {
            <div style="position:absolute;bottom:-20px;left:16px;width:56px;height:56px;border-radius:14px;
                        border:3px solid var(--ca);overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.2)">
              <img [src]="API_BASE + currentStore()!.logoUrl" style="width:100%;height:100%;object-fit:cover" />
            </div>
          }
          <div style="position:absolute;bottom:8px;right:8px;display:flex;gap:6px">
            <a [routerLink]="['/store', currentStore()!.id]" target="_blank"
               style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);color:white;
                      padding:5px 12px;border-radius:99px;font-size:11px;font-weight:600;text-decoration:none">
              Ver pública ↗
            </a>
          </div>
        </div>

        <!-- Tab bar -->
        <div style="display:flex;gap:4px;background:var(--ca);border-radius:var(--r);padding:5px;border:1px solid var(--bo);
                    margin-top:{{ currentStore()!.logoUrl ? '22px' : '4px' }}">
          @for (t of tabs; track t.id) {
            <button (click)="tab.set(t.id)"
                    [style.background]="tab() === t.id ? 'var(--p)' : 'transparent'"
                    [style.color]="tab() === t.id ? 'white' : 'var(--t2)'"
                    style="flex:1;padding:8px 6px;border-radius:var(--rs);border:none;font-weight:600;font-size:12px;cursor:pointer;transition:var(--tr)">
              {{ t.icon }} {{ t.label }}
            </button>
          }
        </div>

        <!-- DASHBOARD TAB -->
        @if (tab() === 'dashboard') {
          <!-- Metric cards -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="card slide-up" style="padding:16px;text-align:center">
              <div style="font-size:28px;font-weight:800;color:var(--p)">{{ stats()?.confirmed || 0 }}</div>
              <div style="font-size:11px;color:var(--t3);margin-top:2px">Marcações confirmadas</div>
            </div>
            <div class="card slide-up" style="padding:16px;text-align:center">
              <div style="font-size:28px;font-weight:800;color:var(--ac)">R$ {{ (stats()?.totalRevenue || 0) | number:'1.0-0' }}</div>
              <div style="font-size:11px;color:var(--t3);margin-top:2px">Receita total</div>
            </div>
            <div class="card slide-up" style="padding:16px;text-align:center">
              <div style="font-size:28px;font-weight:800;color:var(--t)">{{ currentStore()!.members?.length || 0 }}</div>
              <div style="font-size:11px;color:var(--t3);margin-top:2px">Membros da equipa</div>
            </div>
            <div class="card slide-up" style="padding:16px;text-align:center">
              <div style="font-size:28px;font-weight:800;color:var(--t)">{{ stats()?.completed || 0 }}</div>
              <div style="font-size:11px;color:var(--t3);margin-top:2px">Concluídas</div>
            </div>
          </div>

          <!-- Top services -->
          @if (stats()?.byService?.length) {
            <div class="card" style="padding:16px">
              <div style="font-weight:700;font-size:13px;margin-bottom:12px">Serviços mais marcados</div>
              @for (svc of stats()!.byService.slice(0,5); track svc.id) {
                <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--bo)">
                  <div style="flex:1;font-size:13px;font-weight:600;color:var(--t)">{{ svc.name }}</div>
                  <div style="font-size:12px;color:var(--t3)">{{ svc.count }}x</div>
                  <div style="font-size:12px;font-weight:700;color:var(--p)">R$ {{ svc.revenue | number:'1.0-0' }}</div>
                </div>
              }
            </div>
          }
        }

        <!-- CONFIG TAB -->
        @if (tab() === 'config') {
          <div class="card" style="padding:16px">
            <div style="font-weight:700;font-size:13px;margin-bottom:12px">Imagens da loja</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
              <label class="btn btn-g" style="font-size:12px;cursor:pointer">
                {{ currentStore()!.coverUrl ? 'Alterar capa' : 'Adicionar capa' }}
                <input type="file" accept="image/*" style="display:none" (change)="onCoverChange($event)" />
              </label>
              <label class="btn btn-g" style="font-size:12px;cursor:pointer">
                {{ currentStore()!.logoUrl ? 'Alterar logo' : 'Adicionar logo' }}
                <input type="file" accept="image/*" style="display:none" (change)="onLogoChange($event)" />
              </label>
              <div style="display:flex;align-items:center;gap:8px">
                <label style="font-size:12px;font-weight:600;color:var(--t2)">Cor de fundo</label>
                <input type="color" [value]="currentStore()!.backgroundColor || '#6366f1'"
                       (change)="onBgColor($event)"
                       style="width:36px;height:28px;border-radius:6px;border:1.5px solid var(--bo);cursor:pointer;padding:2px" />
              </div>
            </div>

            <div class="field"><label>Nome</label><input type="text" [(ngModel)]="editForm.name" /></div>
            <div class="field"><label>Descrição</label><textarea [(ngModel)]="editForm.description" style="min-height:72px"></textarea></div>
            <div class="field"><label>Categoria</label>
              <select [(ngModel)]="editForm.category">
                @for (c of cats; track c.id) { <option [value]="c.id">{{ c.icon }} {{ c.label }}</option> }
              </select>
            </div>
            @if (saveError()) { <div style="color:var(--re);font-size:12px;margin-top:4px">{{ saveError() }}</div> }
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
              <button class="btn btn-g" (click)="resetEdit()">Cancelar</button>
              <button class="btn btn-p" (click)="saveConfig()">{{ saved() ? '✓ Guardado' : 'Guardar' }}</button>
            </div>
          </div>
        }

        <!-- TEAM TAB -->
        @if (tab() === 'team') {
          <div class="card" style="padding:16px">
            <div style="font-weight:700;font-size:13px;margin-bottom:12px">Adicionar membro</div>
            <input [(ngModel)]="memberSearch" (ngModelChange)="onMemberSearch($event)"
                   placeholder="Pesquisar prestador por nome..."
                   style="width:100%;padding:9px 12px;border:1.5px solid var(--bo);border-radius:var(--rs);
                          font-size:13px;background:var(--bg);color:var(--t);outline:none;box-sizing:border-box;margin-bottom:10px" />
            @if (memberResults().length > 0) {
              <div style="border:1px solid var(--bo);border-radius:var(--rs);overflow:hidden;margin-bottom:12px">
                @for (p of memberResults(); track p.id) {
                  <div style="padding:10px 12px;display:flex;align-items:center;gap:10px;background:var(--ca);border-bottom:1px solid var(--bo)">
                    <app-avatar [initials]="p.user?.avatarInitials || '?'" [color]="color(p)" [size]="32" />
                    <div style="flex:1;font-size:13px;font-weight:600">{{ p.user?.name }}
                      <span style="font-weight:400;color:var(--t3)"> · {{ p.role || p.category }}</span>
                    </div>
                    <button class="btn btn-p" style="padding:4px 12px;font-size:11px" (click)="addMember(p)">Adicionar</button>
                  </div>
                }
              </div>
            }
          </div>

          @if (currentStore()!.members?.length) {
            <div style="display:flex;flex-direction:column;gap:8px">
              @for (m of currentStore()!.members!; track m.id) {
                <div class="card" style="padding:12px 16px;display:flex;align-items:center;gap:12px">
                  @if (m.user?.avatarUrl) {
                    <img [src]="API_BASE + m.user!.avatarUrl" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0" />
                  } @else {
                    <app-avatar [initials]="m.user?.avatarInitials || '?'" [color]="color(m)" [size]="40" />
                  }
                  <div style="flex:1">
                    <div style="font-weight:700;font-size:13px">{{ m.user?.name }}</div>
                    <div style="font-size:11px;color:var(--t3)">{{ m.role || m.category }}</div>
                  </div>
                  <a [routerLink]="['/p', m.id]" style="font-size:11px;color:var(--p);font-weight:600;text-decoration:none;
                     padding:4px 10px;border:1px solid var(--p);border-radius:99px">Ver</a>
                  <button class="btn btn-danger" style="padding:4px 10px;font-size:11px" (click)="removeMember(m.id)">Remover</button>
                </div>
              }
            </div>
          } @else {
            <div style="text-align:center;padding:24px;color:var(--t3);font-size:13px">
              Nenhum membro ainda — pesquise acima para adicionar equipa
            </div>
          }
        }
      }
    </div>
  `,
})
export class StoreMgmtComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  route = inject(ActivatedRoute);

  API_BASE = API_BASE;
  cats = CATEGORIES.filter(c => c.id !== 'all');
  tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'config',    label: 'Configuração', icon: '⚙️' },
    { id: 'team',      label: 'Equipa', icon: '👥' },
  ];

  loading = signal(true);
  stores = signal<Store[]>([]);
  activeStore = signal<Store | null>(null);
  tab = signal('dashboard');
  stats = signal<any>(null);
  showCreate = signal(false);
  createError = signal('');
  saveError = signal('');
  saved = signal(false);

  newStore = { name: '', description: '', category: 'beauty', active: true };
  editForm: any = {};

  memberSearch = '';
  memberResults = signal<ProviderProfile[]>([]);
  private memberTimer: any;

  currentStore = computed(() => this.activeStore() ?? this.stores()[0] ?? null);

  ngOnInit() {
    // Refresh user so plan is always current (e.g. after upgrading)
    this.api.getMe().subscribe({ next: u => this.auth.updateUser(u), error: () => {} });
    const params = this.route.snapshot.queryParams;
    if (params['t'] && ['dashboard', 'config', 'team'].includes(params['t'])) {
      this.tab.set(params['t']);
    }
    this.api.getMyStores().subscribe({
      next: stores => {
        this.stores.set(stores);
        this.loading.set(false);
        const targetId = params['s'];
        if (targetId) {
          const found = stores.find(s => s.id === targetId);
          if (found) { this.selectStore(found); return; }
        }
        if (stores.length === 1) this.selectStore(stores[0]);
      },
      error: () => this.loading.set(false),
    });
    this.api.getProviderStats().subscribe({ next: s => this.stats.set(s), error: () => {} });
  }

  selectStore(s: Store) {
    this.api.getPublicStore(s.id!).subscribe({
      next: full => { this.activeStore.set(full); this.resetEdit(); },
      error: () => { this.activeStore.set(s); this.resetEdit(); },
    });
  }

  resetEdit() {
    const s = this.currentStore();
    if (!s) return;
    this.editForm = { name: s.name, description: s.description || '', category: s.category || 'beauty' };
  }

  saveConfig() {
    const s = this.currentStore();
    if (!s) return;
    this.saveError.set('');
    this.api.updateStore(s.id!, this.editForm).subscribe({
      next: updated => {
        this.activeStore.update(cur => cur ? { ...cur, ...updated } : cur);
        this.stores.update(ss => ss.map(x => x.id === updated.id ? { ...x, ...updated } : x));
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 2000);
      },
      error: e => this.saveError.set(e.error?.message || 'Erro ao guardar'),
    });
  }

  onCoverChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    const s = this.currentStore();
    if (!file || !s) return;
    this.api.uploadStoreCover(s.id!, file).subscribe({
      next: updated => this.activeStore.update(cur => cur ? { ...cur, coverUrl: updated.coverUrl } : cur),
      error: () => {},
    });
  }

  onLogoChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    const s = this.currentStore();
    if (!file || !s) return;
    this.api.uploadStoreLogo(s.id!, file).subscribe({
      next: updated => this.activeStore.update(cur => cur ? { ...cur, logoUrl: updated.logoUrl } : cur),
      error: () => {},
    });
  }

  onBgColor(event: Event) {
    const color = (event.target as HTMLInputElement).value;
    const s = this.currentStore();
    if (!s) return;
    this.activeStore.update(cur => cur ? { ...cur, backgroundColor: color } : cur);
    this.api.updateStore(s.id!, { backgroundColor: color }).subscribe({ error: () => {} });
  }

  createStore() {
    if (!this.newStore.name.trim()) return;
    this.createError.set('');
    this.api.createStore(this.newStore).subscribe({
      next: s => {
        this.stores.update(ss => [...ss, s]);
        this.showCreate.set(false);
        this.selectStore(s);
      },
      error: e => this.createError.set(e.error?.message || 'Erro ao criar loja'),
    });
  }

  onMemberSearch(q: string) {
    clearTimeout(this.memberTimer);
    if (!q.trim()) { this.memberResults.set([]); return; }
    this.memberTimer = setTimeout(() => {
      this.api.getProviders({ q }).subscribe({ next: r => this.memberResults.set(r), error: () => {} });
    }, 300);
  }

  addMember(p: ProviderProfile) {
    const s = this.currentStore();
    if (!s) return;
    this.api.addStoreMember(s.id!, p.id).subscribe({
      next: updated => {
        this.activeStore.update(cur => cur ? { ...cur, members: updated.members } : cur);
        this.memberSearch = '';
        this.memberResults.set([]);
      },
      error: () => {},
    });
  }

  removeMember(providerId: string) {
    const s = this.currentStore();
    if (!s) return;
    this.api.removeStoreMember(s.id!, providerId).subscribe({
      next: updated => this.activeStore.update(cur => cur ? { ...cur, members: updated.members } : cur),
      error: () => {},
    });
  }

  color(p: ProviderProfile) { return getInitialsColor(p.user?.avatarInitials || ''); }
}
