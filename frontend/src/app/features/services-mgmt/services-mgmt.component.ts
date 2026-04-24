import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Service, Promo, BlockedDate, ProviderStats, CATEGORIES } from '../../shared/models';

const API_BASE = 'http://localhost:3000';

@Component({
  selector: 'app-services-mgmt',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div style="display:flex;flex-direction:column;gap:14px">

      @if (!selected()) {
        <!-- ── SERVICES LIST ── -->
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:800;font-size:18px">Serviços</div>
            <div style="font-size:12px;color:var(--t3)">{{ services().length }} serviço{{ services().length === 1 ? '' : 's' }}</div>
          </div>
          <button class="btn btn-p" (click)="openCreate()">+ Novo serviço</button>
        </div>

        @if (showSvcForm()) {
          <div class="card" style="padding:20px">
            <div style="font-weight:700;font-size:14px;margin-bottom:14px">{{ svcForm()!.id ? 'Editar serviço' : 'Novo serviço' }}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div class="field" style="grid-column:1/-1"><label>Nome</label><input type="text" [(ngModel)]="svcForm()!.name" placeholder="Ex: Corte de cabelo" /></div>
              <div class="field"><label>Preço (R$)</label><input type="number" [(ngModel)]="svcForm()!.price" /></div>
              <div class="field"><label>Duração (min)</label><input type="number" [(ngModel)]="svcForm()!.duration" /></div>
              <div class="field" style="grid-column:1/-1"><label>Categoria</label>
                <select [(ngModel)]="svcForm()!.category">
                  @for (c of cats; track c.id) { <option [value]="c.id">{{ c.icon }} {{ c.label }}</option> }
                </select>
              </div>
              <div class="field" style="grid-column:1/-1"><label>Descrição</label><textarea [(ngModel)]="svcForm()!.description" style="min-height:60px"></textarea></div>
            </div>
            @if (svcError()) { <div style="color:var(--re);font-size:12px;margin-top:4px">{{ svcError() }}</div> }
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
              <button class="btn btn-g" (click)="showSvcForm.set(false);svcError.set('')">Cancelar</button>
              <button class="btn btn-p" (click)="saveSvc()">Guardar</button>
            </div>
          </div>
        }

        @for (s of services(); track s.id) {
          <div class="card slide-up" style="overflow:hidden">
            <div style="padding:14px 16px;display:flex;align-items:center;gap:12px">
              <div style="width:46px;height:46px;border-radius:12px;background:var(--px);
                          display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px">
                {{ catIcon(s.category) }}
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:14px;color:var(--t)">{{ s.name }}</div>
                <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">
                  <span class="badge badge-p">R$ {{ s.price }}</span>
                  <span class="badge badge-g">{{ s.duration }} min</span>
                  @if (statsFor(s.id).count > 0) {
                    <span class="badge badge-g">{{ statsFor(s.id).count }} marcações</span>
                  }
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
                <button class="btn btn-p" style="padding:5px 14px;font-size:12px" (click)="selectService(s)">Gerir →</button>
                <button class="btn btn-g" style="padding:5px 14px;font-size:12px" (click)="svcForm.set({...s});showSvcForm.set(true)">Editar</button>
              </div>
            </div>
          </div>
        }

        @if (services().length === 0 && !showSvcForm()) {
          <div class="card" style="padding:48px;text-align:center;color:var(--t3)">
            <div style="font-size:40px;margin-bottom:10px">🛠</div>
            <div style="font-weight:700;font-size:15px;margin-bottom:4px">Nenhum serviço</div>
            <div style="font-size:13px">Crie o seu primeiro serviço para começar a receber marcações.</div>
          </div>
        }

      } @else {
        <!-- ── SERVICE DETAIL ── -->
        <div style="display:flex;align-items:center;gap:10px">
          <button class="btn btn-g" style="padding:6px 12px;font-size:12px" (click)="selected.set(null)">← Serviços</button>
          <div style="font-weight:800;font-size:16px;flex:1;truncate">{{ selected()!.name }}</div>
          <div style="display:flex;gap:6px">
            <span class="badge badge-p">R$ {{ selected()!.price }}</span>
            <span class="badge badge-g">{{ selected()!.duration }}min</span>
          </div>
        </div>

        <!-- Sub-tabs -->
        <div style="display:flex;gap:4px;background:var(--ca);border-radius:var(--r);padding:5px;border:1px solid var(--bo)">
          @for (t of svcTabs; track t.id) {
            <button (click)="svcTab.set(t.id)"
                    [style.background]="svcTab() === t.id ? 'var(--p)' : 'transparent'"
                    [style.color]="svcTab() === t.id ? 'white' : 'var(--t2)'"
                    style="flex:1;padding:8px 4px;border-radius:var(--rs);border:none;font-weight:600;font-size:12px;cursor:pointer;transition:var(--tr)">
              {{ t.icon }} {{ t.label }}
            </button>
          }
        </div>

        <!-- DASHBOARD -->
        @if (svcTab() === 'dashboard') {
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="card slide-up" style="padding:16px;text-align:center">
              <div style="font-size:28px;font-weight:800;color:var(--p)">{{ statsFor(selected()!.id).count }}</div>
              <div style="font-size:11px;color:var(--t3);margin-top:2px">Total marcações</div>
            </div>
            <div class="card slide-up" style="padding:16px;text-align:center">
              <div style="font-size:28px;font-weight:800;color:var(--ac)">R$ {{ statsFor(selected()!.id).revenue | number:'1.0-0' }}</div>
              <div style="font-size:11px;color:var(--t3);margin-top:2px">Receita</div>
            </div>
          </div>

          <!-- Upcoming bookings for this service -->
          <div class="card" style="padding:16px">
            <div style="font-weight:700;font-size:13px;margin-bottom:12px">Próximas marcações</div>
            @if (upcomingForService().length === 0) {
              <div style="text-align:center;padding:20px;color:var(--t3);font-size:13px">Sem marcações próximas</div>
            }
            @for (b of upcomingForService(); track b.id) {
              <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--bo)">
                <div style="width:40px;height:40px;border-radius:10px;background:var(--px);display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0">
                  <div style="font-size:10px;font-weight:700;color:var(--p)">{{ dayLabel(b.date) }}</div>
                  <div style="font-size:14px;font-weight:800;color:var(--p)">{{ dayNum(b.date) }}</div>
                </div>
                <div style="flex:1">
                  <div style="font-weight:600;font-size:13px">{{ b.client?.name || b.guestName || 'Cliente' }}</div>
                  <div style="font-size:11px;color:var(--t3)">{{ b.time }} · R$ {{ b.finalPrice }}</div>
                </div>
                <span class="badge" [class]="b.status === 'confirmed' ? 'badge-p' : 'badge-g'">{{ b.status }}</span>
              </div>
            }
          </div>
        }

        <!-- HORÁRIO -->
        @if (svcTab() === 'horario') {
          <!-- Working days quick toggle -->
          <div class="card" style="padding:16px">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px">Dias de trabalho</div>
            <div style="font-size:12px;color:var(--t3);margin-bottom:14px">Toque para abrir/fechar o dia</div>
            <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">
              @for (d of weekDays; track d.key) {
                <button (click)="toggleDay(d.key)"
                        [style.background]="isWorkDay(d.key) ? 'var(--p)' : 'var(--bg2)'"
                        [style.color]="isWorkDay(d.key) ? 'white' : 'var(--t3)'"
                        style="padding:10px 4px;border-radius:10px;border:none;cursor:pointer;
                               font-size:11px;font-weight:700;transition:var(--tr);text-align:center">
                  {{ d.short }}<br>
                  <span style="font-size:9px;opacity:0.8">{{ isWorkDay(d.key) ? '✓' : '×' }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Work hours per day -->
          <div class="card" style="padding:16px">
            <div style="font-weight:700;font-size:13px;margin-bottom:12px">Horário por dia</div>
            @for (d of workDays(); track d) {
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:8px;border-radius:var(--rs);background:var(--bg)">
                <div style="font-size:12px;font-weight:700;color:var(--p);width:32px">{{ d }}</div>
                <select [(ngModel)]="dayHours[d].start" style="flex:1;padding:6px 8px;border:1px solid var(--bo);border-radius:var(--rs);font-size:12px;background:var(--bg);color:var(--t)">
                  @for (h of hours; track h) { <option [value]="h">{{ h }}</option> }
                </select>
                <span style="font-size:12px;color:var(--t3)">até</span>
                <select [(ngModel)]="dayHours[d].end" style="flex:1;padding:6px 8px;border:1px solid var(--bo);border-radius:var(--rs);font-size:12px;background:var(--bg);color:var(--t)">
                  @for (h of hours; track h) { <option [value]="h">{{ h }}</option> }
                </select>
                <button (click)="addDayOff(d)"
                        style="padding:5px 10px;border-radius:99px;border:1.5px solid var(--re);
                               background:transparent;color:var(--re);font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap">
                  Fechar hoje
                </button>
              </div>
            }
          </div>

          <!-- Blocked dates: day offs -->
          <div class="card" style="padding:16px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div>
                <div style="font-weight:700;font-size:13px">Dias fechados</div>
                <div style="font-size:11px;color:var(--t3)">Dias específicos sem marcações</div>
              </div>
              <button class="btn btn-g" style="font-size:12px;padding:5px 12px" (click)="addBlockModal.set(true)">+ Fechar dia</button>
            </div>
            @if (dayoffs().length === 0) {
              <div style="text-align:center;padding:16px;color:var(--t3);font-size:12px">Nenhum dia fechado</div>
            }
            @for (b of dayoffs(); track b.id) {
              <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--bo)">
                <div style="flex:1">
                  <div style="font-size:13px;font-weight:600">{{ formatDate(b.startDate) }}</div>
                  @if (b.note) { <div style="font-size:11px;color:var(--t3)">{{ b.note }}</div> }
                </div>
                <button (click)="removeBlocked(b.id)"
                        style="padding:3px 10px;border-radius:99px;border:1px solid var(--re);
                               background:transparent;color:var(--re);font-size:11px;cursor:pointer">×</button>
              </div>
            }
          </div>

          <!-- Vacation section -->
          <div class="card" style="padding:16px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div>
                <div style="font-weight:700;font-size:13px">🏖 Férias</div>
                <div style="font-size:11px;color:var(--t3)">Períodos sem marcações</div>
              </div>
              <button class="btn btn-g" style="font-size:12px;padding:5px 12px" (click)="vacModal.set(true)">+ Adicionar férias</button>
            </div>
            @if (vacations().length === 0) {
              <div style="text-align:center;padding:16px;color:var(--t3);font-size:12px">Nenhum período de férias</div>
            }
            @for (v of vacations(); track v.id) {
              <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--bo)">
                <div style="font-size:16px">🏖</div>
                <div style="flex:1">
                  <div style="font-size:13px;font-weight:600">{{ formatDate(v.startDate) }} → {{ v.endDate ? formatDate(v.endDate) : '...' }}</div>
                  @if (v.note) { <div style="font-size:11px;color:var(--t3)">{{ v.note }}</div> }
                </div>
                <button (click)="removeBlocked(v.id)"
                        style="padding:3px 10px;border-radius:99px;border:1px solid var(--re);
                               background:transparent;color:var(--re);font-size:11px;cursor:pointer">×</button>
              </div>
            }
          </div>
        }

        <!-- DESCONTOS -->
        @if (svcTab() === 'descontos') {
          @if (promoForm()) {
            <div class="card" style="padding:20px">
              <div style="font-weight:700;font-size:14px;margin-bottom:14px">{{ promoForm()!.id ? 'Editar desconto' : 'Novo desconto' }}</div>
              <div class="field"><label>Título</label><input type="text" [(ngModel)]="promoForm()!.title" placeholder="Ex: Promoção de verão" /></div>
              <div class="field"><label>Desconto %</label><input type="number" min="1" max="99" [(ngModel)]="promoForm()!.discountPct" /></div>
              <div class="field"><label>Válido até</label><input type="date" [(ngModel)]="promoForm()!.endsAt" /></div>
              <div class="field"><label>Descrição</label><textarea [(ngModel)]="promoForm()!.description"></textarea></div>
              @if (promoForm()!.discountPct) {
                <div style="background:var(--px);border-radius:var(--rs);padding:10px 14px;margin-bottom:8px">
                  <div style="font-size:12px;color:var(--t2);margin-bottom:4px">Pré-visualização</div>
                  <div style="display:flex;gap:10px;align-items:center">
                    <span style="font-size:13px;text-decoration:line-through;color:var(--t3)">R$ {{ selected()!.price }}</span>
                    <span style="font-size:18px;font-weight:800;color:var(--re)">R$ {{ promoPrice() }}</span>
                    <span class="badge badge-promo">-{{ promoForm()!.discountPct }}% OFF</span>
                  </div>
                </div>
              }
              @if (promoError()) { <div style="color:var(--re);font-size:12px;margin-top:4px">{{ promoError() }}</div> }
              <div style="display:flex;gap:8px;justify-content:flex-end">
                <button class="btn btn-g" (click)="promoForm.set(null)">Cancelar</button>
                <button class="btn btn-p" (click)="savePromo()">Publicar</button>
              </div>
            </div>
          } @else {
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="font-weight:700;font-size:14px">Descontos para "{{ selected()!.name }}"</div>
              <button class="btn btn-p" style="font-size:12px" (click)="promoForm.set({ title:'', discountPct:0, description:'', active:true, serviceId: selected()!.id })">+ Novo desconto</button>
            </div>
            @for (p of servicePromos(); track p.id) {
              <div class="card" style="padding:14px 16px;display:flex;align-items:center;gap:12px;border-left:4px solid var(--re)">
                <div style="flex:1">
                  <div style="font-weight:700;font-size:14px;margin-bottom:2px">{{ p.title }}</div>
                  <div style="display:flex;gap:8px;align-items:center">
                    <span class="badge badge-promo">-{{ p.discountPct }}% OFF</span>
                    @if (p.endsAt) { <span style="font-size:11px;color:var(--t3)">até {{ formatDate(p.endsAt) }}</span> }
                    <span class="badge" [class]="p.active ? 'badge-p' : 'badge-g'">{{ p.active ? 'Ativo' : 'Pausado' }}</span>
                  </div>
                </div>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-g" style="padding:5px 10px;font-size:11px" (click)="togglePromo(p)">{{ p.active ? 'Pausar' : 'Ativar' }}</button>
                  <button class="btn btn-g" style="padding:5px 10px;font-size:11px" (click)="promoForm.set({...p})">Editar</button>
                  <button class="btn btn-danger" style="padding:5px 10px;font-size:11px" (click)="deletePromo(p.id!)">×</button>
                </div>
              </div>
            }
            @if (servicePromos().length === 0) {
              <div class="card" style="padding:40px;text-align:center;color:var(--t3)">
                <div style="font-size:36px;margin-bottom:8px">🏷</div>
                <div style="font-weight:600">Sem descontos activos</div>
              </div>
            }
          }
        }
      }

      <!-- Blocked date modal -->
      @if (addBlockModal()) {
        <div class="overlay" (click)="addBlockModal.set(false)" style="z-index:100">
          <div class="card" style="width:100%;max-width:360px;padding:24px" (click)="$event.stopPropagation()">
            <div style="font-weight:700;font-size:15px;margin-bottom:14px">Fechar um dia</div>
            <div class="field"><label>Data</label><input type="date" [(ngModel)]="blockForm.startDate" /></div>
            <div class="field"><label>Motivo (opcional)</label><input type="text" [(ngModel)]="blockForm.note" placeholder="Ex: Evento pessoal" /></div>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
              <button class="btn btn-g" (click)="addBlockModal.set(false)">Cancelar</button>
              <button class="btn btn-p" (click)="saveBlock('dayoff')">Fechar</button>
            </div>
          </div>
        </div>
      }

      <!-- Vacation modal -->
      @if (vacModal()) {
        <div class="overlay" (click)="vacModal.set(false)" style="z-index:100">
          <div class="card" style="width:100%;max-width:360px;padding:24px" (click)="$event.stopPropagation()">
            <div style="font-weight:700;font-size:15px;margin-bottom:14px">🏖 Adicionar férias</div>
            <div class="field"><label>De</label><input type="date" [(ngModel)]="vacForm.startDate" /></div>
            <div class="field"><label>Até</label><input type="date" [(ngModel)]="vacForm.endDate" /></div>
            <div class="field"><label>Nota (opcional)</label><input type="text" [(ngModel)]="vacForm.note" placeholder="Ex: Férias de verão" /></div>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
              <button class="btn btn-g" (click)="vacModal.set(false)">Cancelar</button>
              <button class="btn btn-p" (click)="saveVacation()">Guardar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ServicesMgmtComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  route = inject(ActivatedRoute);

  API_BASE = API_BASE;
  cats = CATEGORIES.filter(c => c.id !== 'all');
  svcTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'horario',   label: 'Horário',   icon: '⏰' },
    { id: 'descontos', label: 'Descontos', icon: '🏷' },
  ];
  weekDays = [
    { key: 'Seg', short: 'Seg' }, { key: 'Ter', short: 'Ter' }, { key: 'Qua', short: 'Qua' },
    { key: 'Qui', short: 'Qui' }, { key: 'Sex', short: 'Sex' }, { key: 'Sáb', short: 'Sáb' },
    { key: 'Dom', short: 'Dom' },
  ];
  hours = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];

  services = signal<Partial<Service>[]>([]);
  selected = signal<Partial<Service> | null>(null);
  svcTab = signal('dashboard');
  showSvcForm = signal(false);
  svcForm = signal<Partial<Service> | null>(null);
  svcError = signal('');

  promos = signal<Partial<Promo>[]>([]);
  promoForm = signal<Partial<Promo> | null>(null);
  promoError = signal('');

  blockedDates = signal<BlockedDate[]>([]);
  addBlockModal = signal(false);
  vacModal = signal(false);
  blockForm = { startDate: '', note: '' };
  vacForm = { startDate: '', endDate: '', note: '' };

  stats = signal<any>(null);
  incomingBookings = signal<any[]>([]);

  openDays = signal<string[]>(['Seg', 'Ter', 'Qua', 'Qui', 'Sex']);
  dayHours: Record<string, { start: string; end: string }> = {};

  workDays = computed(() => this.openDays());
  dayoffs = computed(() => this.blockedDates().filter(b => b.type === 'dayoff'));
  vacations = computed(() => this.blockedDates().filter(b => b.type === 'vacation'));
  servicePromos = computed(() => this.selected() ? this.promos().filter(p => p.serviceId === this.selected()!.id) : []);
  upcomingForService = computed(() => {
    const sid = this.selected()?.id;
    if (!sid) return [];
    const today = new Date().toISOString().split('T')[0];
    return this.incomingBookings()
      .filter(b => b.serviceId === sid && b.date >= today && b.status === 'confirmed')
      .slice(0, 10);
  });

  ngOnInit() {
    this.api.getMyServices().subscribe({ next: s => { this.services.set(s); this.initDayHours(); }, error: () => {} });
    this.api.getMyPromos().subscribe({ next: p => this.promos.set(p), error: () => {} });
    this.api.getBlockedDates().subscribe({ next: b => this.blockedDates.set(b), error: () => {} });
    this.api.getProviderStats().subscribe({ next: s => this.stats.set(s), error: () => {} });
    this.api.getIncomingBookings().subscribe({ next: b => this.incomingBookings.set(b), error: () => {} });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.getMyServices().subscribe({
        next: svcs => { const s = svcs.find((x: any) => x.id === id); if (s) this.selectService(s); },
        error: () => {},
      });
    }
  }

  initDayHours() {
    for (const d of this.weekDays) {
      if (!this.dayHours[d.key]) this.dayHours[d.key] = { start: '09:00', end: '18:00' };
    }
  }

  selectService(s: Partial<Service>) {
    this.selected.set(s);
    this.svcTab.set('dashboard');
    this.promoForm.set(null);
  }

  openCreate() {
    this.svcForm.set({ name: '', price: 0, duration: 60, category: 'beauty', description: '' });
    this.showSvcForm.set(true);
  }

  saveSvc() {
    const f = this.svcForm();
    if (!f || !f.name || !f.price) return;
    this.svcError.set('');
    if (f.id) {
      this.api.updateService(f.id, f).subscribe({
        next: s => { this.services.update(ss => ss.map(x => x.id === s.id ? s : x)); this.showSvcForm.set(false); if (this.selected()?.id === s.id) this.selected.set(s); },
        error: () => this.svcError.set('Erro ao actualizar.'),
      });
    } else {
      this.api.createService(f).subscribe({
        next: s => { this.services.update(ss => [...ss, s]); this.showSvcForm.set(false); },
        error: () => this.svcError.set('Erro ao criar serviço.'),
      });
    }
  }

  statsFor(serviceId?: string) {
    if (!serviceId || !this.stats()) return { count: 0, revenue: 0 };
    return this.stats().byService.find((s: any) => s.id === serviceId) || { count: 0, revenue: 0 };
  }

  isWorkDay(key: string) { return this.openDays().includes(key); }

  toggleDay(key: string) {
    this.openDays.update(days => days.includes(key) ? days.filter(d => d !== key) : [...days, key]);
  }

  addDayOff(day: string) {
    const today = new Date().toISOString().split('T')[0];
    this.blockForm = { startDate: today, note: `${day} fechado` };
    this.addBlockModal.set(true);
  }

  saveBlock(type: 'dayoff' | 'vacation') {
    if (!this.blockForm.startDate) return;
    this.api.createBlockedDate({ ...this.blockForm, type }).subscribe({
      next: b => {
        this.blockedDates.update(bs => [...bs, b]);
        this.addBlockModal.set(false);
        this.blockForm = { startDate: '', note: '' };
      },
      error: () => {},
    });
  }

  saveVacation() {
    if (!this.vacForm.startDate) return;
    this.api.createBlockedDate({ ...this.vacForm, type: 'vacation' }).subscribe({
      next: b => {
        this.blockedDates.update(bs => [...bs, b]);
        this.vacModal.set(false);
        this.vacForm = { startDate: '', endDate: '', note: '' };
      },
      error: () => {},
    });
  }

  removeBlocked(id: string) {
    this.api.deleteBlockedDate(id).subscribe({
      next: () => this.blockedDates.update(bs => bs.filter(b => b.id !== id)),
      error: () => {},
    });
  }

  savePromo() {
    const f = this.promoForm();
    if (!f || !f.title || !f.discountPct) return;
    this.promoError.set('');
    if (f.id) {
      this.api.updatePromo(f.id, f).subscribe({
        next: p => { this.promos.update(ps => ps.map(x => x.id === p.id ? p : x)); this.promoForm.set(null); },
        error: () => this.promoError.set('Erro ao actualizar.'),
      });
    } else {
      this.api.createPromo(f).subscribe({
        next: p => { this.promos.update(ps => [...ps, p]); this.promoForm.set(null); },
        error: () => this.promoError.set('Erro ao criar desconto.'),
      });
    }
  }

  togglePromo(p: any) {
    const u = { ...p, active: !p.active };
    this.promos.update(ps => ps.map(x => x.id === p.id ? u : x));
    this.api.updatePromo(p.id, u).subscribe({ error: () => this.promos.update(ps => ps.map(x => x.id === p.id ? p : x)) });
  }

  deletePromo(id: string) {
    this.api.deletePromo(id).subscribe({ next: () => this.promos.update(ps => ps.filter(p => p.id !== id)) });
  }

  promoPrice() {
    const f = this.promoForm();
    const s = this.selected();
    if (!f?.discountPct || !s?.price) return 0;
    return Math.round(s.price * (1 - f.discountPct / 100));
  }

  catIcon(id?: string) { return CATEGORIES.find(c => c.id === id)?.icon || '🛠'; }

  dayLabel(date: string) {
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.','').toUpperCase();
  }
  dayNum(date: string) { return new Date(date + 'T00:00:00').getDate(); }
  formatDate(date?: string) {
    if (!date) return '';
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' });
  }
}
