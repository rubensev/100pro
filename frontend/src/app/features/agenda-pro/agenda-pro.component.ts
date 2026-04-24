import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Service, BlockedDate } from '../../shared/models';

function toISO(d: Date) { return d.toISOString().split('T')[0]; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function startOfWeek(d = new Date()) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const r = new Date(d);
  r.setDate(r.getDate() + diff);
  r.setHours(0,0,0,0);
  return r;
}

const DAY_LABELS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const MONTH_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];

@Component({
  selector: 'app-agenda-pro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .booking-card { border-radius:8px; padding:6px 8px; font-size:11px; cursor:pointer; transition:opacity 0.15s; }
    .booking-card:hover { opacity:0.85; }
    .day-col { flex:1; min-width:110px; display:flex; flex-direction:column; gap:4px; }
    .day-header { text-align:center; padding:10px 4px 8px; border-bottom:1px solid var(--bo); }
    .today-col .day-header { background:var(--px); border-radius:10px 10px 0 0; }
    .today-col .day-num { color:var(--p); }
    .week-grid { display:flex; gap:8px; overflow-x:auto; padding-bottom:8px; }
  `],
  template: `
    <div style="display:flex;flex-direction:column;gap:14px">

      <!-- Week nav header -->
      <div class="card" style="padding:12px 16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <button class="btn btn-g" style="padding:6px 12px;font-size:13px" (click)="prevWeek()">←</button>
        <div style="flex:1;text-align:center;font-weight:700;font-size:14px">{{ weekLabel() }}</div>
        <button class="btn btn-g" style="padding:6px 12px;font-size:13px" (click)="nextWeek()">→</button>
        <button class="btn btn-g" style="padding:6px 12px;font-size:12px" (click)="goToday()">Hoje</button>
        <button class="btn btn-p" style="padding:6px 14px;font-size:12px" (click)="openManualModal()">+ Marcação manual</button>
      </div>

      <!-- Legend -->
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <div style="display:flex;gap:5px;align-items:center;font-size:11px;color:var(--t3)">
          <div style="width:12px;height:12px;border-radius:3px;background:#22c55e"></div> Confirmada
        </div>
        <div style="display:flex;gap:5px;align-items:center;font-size:11px;color:var(--t3)">
          <div style="width:12px;height:12px;border-radius:3px;background:#f59e0b"></div> Concluída
        </div>
        <div style="display:flex;gap:5px;align-items:center;font-size:11px;color:var(--t3)">
          <div style="width:12px;height:12px;border-radius:3px;background:#ef4444"></div> Cancelada
        </div>
        <div style="display:flex;gap:5px;align-items:center;font-size:11px;color:var(--t3)">
          <div style="width:12px;height:12px;border-radius:3px;background:var(--bg2);border:1px solid var(--bo)"></div> Fechado
        </div>
      </div>

      <!-- Week grid -->
      @if (loading()) {
        <div style="display:flex;align-items:center;justify-content:center;padding:48px">
          <svg class="spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--p)" stroke-width="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
          </svg>
        </div>
      } @else {
        <div class="week-grid">
          @for (day of weekDays(); track day.iso) {
            <div class="day-col" [class.today-col]="day.isToday"
                 style="border:1px solid var(--bo);border-radius:10px;background:var(--ca);overflow:hidden">
              <!-- Day header -->
              <div class="day-header">
                <div style="font-size:10px;font-weight:700;color:var(--t3);letter-spacing:0.05em">{{ day.label }}</div>
                <div class="day-num" style="font-size:20px;font-weight:800;color:var(--t);line-height:1.2">{{ day.num }}</div>
                <div style="font-size:10px;color:var(--t3)">{{ day.month }}</div>
                @if (isBlocked(day.iso)) {
                  <div style="margin-top:4px;font-size:10px;background:var(--bg2);border-radius:99px;padding:2px 8px;color:var(--t3)">
                    {{ blockedLabel(day.iso) }}
                  </div>
                }
              </div>

              <!-- Bookings for this day -->
              <div style="padding:6px;display:flex;flex-direction:column;gap:4px;min-height:120px">
                @if (isBlocked(day.iso)) {
                  <div style="text-align:center;padding:20px 8px;color:var(--t3);font-size:11px">
                    🚫 Fechado
                  </div>
                } @else {
                  @for (b of bookingsForDay(day.iso); track b.id) {
                    <div class="booking-card"
                         [style.background]="statusColor(b.status) + '22'"
                         [style.border-left]="'3px solid ' + statusColor(b.status)"
                         (click)="selectedBooking.set(b)">
                      <div style="font-weight:700;font-size:11px;color:var(--t)">{{ b.time }}</div>
                      <div style="color:var(--t2);font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                        {{ b.client?.name || b.guestName || 'Cliente' }}
                      </div>
                      <div style="color:var(--t3);font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                        {{ b.service?.name || '' }}
                      </div>
                    </div>
                  }
                  @if (bookingsForDay(day.iso).length === 0) {
                    <div style="text-align:center;padding:20px 4px;color:var(--t3);font-size:10px">Livre</div>
                  }
                  <button (click)="openManualModal(day.iso)"
                          style="margin-top:auto;padding:5px;border-radius:6px;border:1px dashed var(--bo);
                                 background:transparent;color:var(--t3);font-size:10px;cursor:pointer;
                                 width:100%;transition:var(--tr)"
                          (mouseenter)="$any($event.currentTarget).style.borderColor='var(--p)';$any($event.currentTarget).style.color='var(--p)'"
                          (mouseleave)="$any($event.currentTarget).style.borderColor='var(--bo)';$any($event.currentTarget).style.color='var(--t3)'">
                    + Marcação
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <!-- Week summary -->
        <div class="card" style="padding:12px 16px;display:flex;gap:16px;flex-wrap:wrap">
          <div style="font-size:12px;color:var(--t2)">
            <span style="font-weight:700;font-size:16px;color:var(--t)">{{ weekTotal() }}</span> marcações esta semana
          </div>
          <div style="font-size:12px;color:var(--t2)">
            <span style="font-weight:700;font-size:16px;color:var(--p)">R$ {{ weekRevenue() | number:'1.0-0' }}</span> receita estimada
          </div>
        </div>
      }

      <!-- Booking detail modal -->
      @if (selectedBooking()) {
        <div class="overlay" (click)="selectedBooking.set(null)" style="z-index:100">
          <div class="card" style="width:100%;max-width:380px;padding:24px" (click)="$event.stopPropagation()">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
              <div style="font-weight:800;font-size:16px">Marcação</div>
              <button (click)="selectedBooking.set(null)"
                      style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--t3)">×</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px">
              <div style="display:flex;justify-content:space-between">
                <span style="font-size:12px;color:var(--t3)">Cliente</span>
                <span style="font-size:13px;font-weight:600">{{ selectedBooking()!.client?.name || selectedBooking()!.guestName || 'Não especificado' }}</span>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="font-size:12px;color:var(--t3)">Serviço</span>
                <span style="font-size:13px;font-weight:600">{{ selectedBooking()!.service?.name || '—' }}</span>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="font-size:12px;color:var(--t3)">Data & hora</span>
                <span style="font-size:13px;font-weight:600">{{ formatDate(selectedBooking()!.date) }} às {{ selectedBooking()!.time }}</span>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="font-size:12px;color:var(--t3)">Valor</span>
                <span style="font-size:13px;font-weight:700;color:var(--p)">R$ {{ selectedBooking()!.finalPrice }}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:12px;color:var(--t3)">Estado</span>
                <span class="badge" [class]="selectedBooking()!.status === 'confirmed' ? 'badge-p' : 'badge-g'">
                  {{ statusLabel(selectedBooking()!.status) }}
                </span>
              </div>
            </div>
            @if (selectedBooking()!.status === 'confirmed') {
              <div style="display:flex;gap:8px;margin-top:16px">
                <button class="btn btn-danger" style="flex:1;font-size:12px" (click)="cancelBooking(selectedBooking()!.id)">Cancelar marcação</button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Manual booking modal -->
      @if (manualModal()) {
        <div class="overlay" (click)="manualModal.set(false)" style="z-index:100">
          <div class="card" style="width:100%;max-width:400px;padding:24px" (click)="$event.stopPropagation()">
            <div style="font-weight:800;font-size:16px;margin-bottom:16px">+ Marcação manual</div>
            <div style="display:flex;flex-direction:column;gap:10px">
              <div class="field" style="margin:0"><label>Nome do cliente *</label>
                <input type="text" [(ngModel)]="manForm.guestName" placeholder="Nome do cliente" />
              </div>
              <div class="field" style="margin:0"><label>Contacto (opcional)</label>
                <input type="text" [(ngModel)]="manForm.guestContact" placeholder="Telemóvel ou email" />
              </div>
              <div class="field" style="margin:0"><label>Serviço *</label>
                <select [(ngModel)]="manForm.serviceId" (ngModelChange)="onServiceSelect($event)">
                  <option value="">Seleccionar serviço</option>
                  @for (s of services(); track s.id) { <option [value]="s.id">{{ s.name }} — R$ {{ s.price }}</option> }
                </select>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div class="field" style="margin:0"><label>Data *</label>
                  <input type="date" [(ngModel)]="manForm.date" />
                </div>
                <div class="field" style="margin:0"><label>Hora *</label>
                  <select [(ngModel)]="manForm.time">
                    @for (h of hours; track h) { <option [value]="h">{{ h }}</option> }
                  </select>
                </div>
              </div>
              <div class="field" style="margin:0"><label>Valor (R$)</label>
                <input type="number" [(ngModel)]="manForm.finalPrice" />
              </div>
            </div>
            @if (manError()) { <div style="color:var(--re);font-size:12px;margin-top:8px">{{ manError() }}</div> }
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
              <button class="btn btn-g" (click)="manualModal.set(false)">Cancelar</button>
              <button class="btn btn-p" (click)="saveManual()" [style.opacity]="manSaving() ? '0.6' : '1'">
                {{ manSaving() ? 'A guardar...' : 'Criar marcação' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AgendaProComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);

  loading = signal(true);
  weekStart = signal(startOfWeek());
  allBookings = signal<any[]>([]);
  services = signal<Partial<Service>[]>([]);
  blockedDates = signal<BlockedDate[]>([]);
  selectedBooking = signal<any>(null);
  manualModal = signal(false);
  manError = signal('');
  manSaving = signal(false);
  hours = HOURS;

  manForm = { guestName: '', guestContact: '', serviceId: '', date: '', time: '09:00', finalPrice: 0 };

  weekDays = computed(() => {
    const ws = this.weekStart();
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(ws, i);
      const iso = toISO(d);
      return {
        iso,
        label: DAY_LABELS[i],
        num: d.getDate(),
        month: MONTH_LABELS[d.getMonth()],
        isToday: iso === toISO(new Date()),
      };
    });
  });

  weekLabel = computed(() => {
    const days = this.weekDays();
    const first = days[0];
    const last = days[6];
    return `${first.num} ${first.month} – ${last.num} ${last.month} ${addDays(this.weekStart(), 0).getFullYear()}`;
  });

  weekTotal = computed(() => {
    const isos = new Set(this.weekDays().map(d => d.iso));
    return this.allBookings().filter(b => isos.has(b.date) && b.status !== 'cancelled').length;
  });

  weekRevenue = computed(() => {
    const isos = new Set(this.weekDays().map(d => d.iso));
    return this.allBookings()
      .filter(b => isos.has(b.date) && b.status !== 'cancelled')
      .reduce((s, b) => s + Number(b.finalPrice || 0), 0);
  });

  ngOnInit() {
    this.api.getIncomingBookings().subscribe({
      next: b => { this.allBookings.set(b); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.getMyServices().subscribe({ next: s => this.services.set(s), error: () => {} });
    this.api.getBlockedDates().subscribe({ next: b => this.blockedDates.set(b), error: () => {} });
  }

  prevWeek() { this.weekStart.update(d => addDays(d, -7)); }
  nextWeek() { this.weekStart.update(d => addDays(d, 7)); }
  goToday() { this.weekStart.set(startOfWeek()); }

  bookingsForDay(iso: string) {
    return this.allBookings()
      .filter(b => b.date === iso)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  isBlocked(iso: string) {
    return this.blockedDates().some(b =>
      b.startDate <= iso && (!b.endDate || b.endDate >= iso)
    );
  }

  blockedLabel(iso: string) {
    const b = this.blockedDates().find(b => b.startDate <= iso && (!b.endDate || b.endDate >= iso));
    if (!b) return '';
    return b.type === 'vacation' ? '🏖 Férias' : b.note || 'Fechado';
  }

  statusColor(status: string) {
    if (status === 'confirmed') return '#22c55e';
    if (status === 'completed') return '#f59e0b';
    return '#ef4444';
  }

  statusLabel(status: string) {
    if (status === 'confirmed') return 'Confirmada';
    if (status === 'completed') return 'Concluída';
    return 'Cancelada';
  }

  openManualModal(date?: string) {
    this.manForm = {
      guestName: '', guestContact: '', serviceId: '',
      date: date || toISO(new Date()),
      time: '09:00', finalPrice: 0,
    };
    this.manError.set('');
    this.manualModal.set(true);
  }

  onServiceSelect(serviceId: string) {
    const svc = this.services().find(s => s.id === serviceId);
    if (svc) this.manForm.finalPrice = svc.price as number;
  }

  saveManual() {
    if (!this.manForm.guestName.trim() || !this.manForm.serviceId || !this.manForm.date) {
      this.manError.set('Preencha nome, serviço e data.');
      return;
    }
    this.manError.set('');
    this.manSaving.set(true);
    this.api.createManualBooking(this.manForm).subscribe({
      next: b => {
        this.allBookings.update(bs => [...bs, b]);
        this.manualModal.set(false);
        this.manSaving.set(false);
      },
      error: e => {
        this.manError.set(e.error?.message || 'Erro ao criar marcação.');
        this.manSaving.set(false);
      },
    });
  }

  cancelBooking(id: string) {
    this.api.cancelBooking(id).subscribe({
      next: updated => {
        this.allBookings.update(bs => bs.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
        this.selectedBooking.set(null);
      },
      error: () => {},
    });
  }

  formatDate(date: string) {
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
}
