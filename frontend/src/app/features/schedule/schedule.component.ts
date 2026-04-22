import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { Booking, getInitialsColor } from '../../shared/models';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="font-weight:800;font-size:20px">Meus Agendamentos</div>

      @if (loading()) {
        <div style="text-align:center;padding:40px;color:var(--t3)">
          <div style="font-size:24px;margin-bottom:8px">⏳</div>
          <div style="font-size:13px">Carregando agendamentos...</div>
        </div>
      }

      @if (!loading()) {
        @for (ev of bookings(); track ev.id; let i = $index) {
          <div class="card fu" style="padding:13px 16px;display:flex;gap:14px;align-items:center"
               [style.border-left]="'4px solid ' + color(ev.provider?.user?.avatarInitials || '')"
               [style.animation-delay]="i * 0.05 + 's'">
            <div style="text-align:center;min-width:38px">
              <div style="font-weight:800;font-size:22px;line-height:1">{{ day(ev.date) }}</div>
              <div style="font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:0.06em">{{ month(ev.date) }}</div>
            </div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:14px">{{ ev.service?.name }}</div>
              <div style="font-size:12px;color:var(--t2);margin-top:1px">{{ ev.provider?.user?.name }} · {{ ev.time }}</div>
              @if (ev.finalPrice) {
                <div style="font-size:12px;color:var(--p);font-weight:600;margin-top:2px">R$ {{ ev.finalPrice }}</div>
              }
            </div>
            <span class="badge" [class]="ev.status === 'confirmed' ? 'badge-p' : ev.status === 'completed' ? 'badge-g' : 'badge-g'"
                  style="font-size:11px">
              {{ ev.status === 'confirmed' ? 'Confirmado' : ev.status === 'completed' ? 'Concluído' : 'Cancelado' }}
            </span>
          </div>
        }
        @if (bookings().length === 0) {
          <div class="card" style="padding:48px;text-align:center;color:var(--t3)">
            <div style="font-size:40px;margin-bottom:12px">📅</div>
            <div style="font-weight:600;font-size:16px">Nenhum agendamento</div>
            <div style="font-size:13px;margin-top:6px">Explore profissionais e agende seu primeiro serviço</div>
          </div>
        }
      }
    </div>
  `,
})
export class ScheduleComponent implements OnInit {
  api = inject(ApiService);
  bookings = signal<Booking[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.getBookings().subscribe({
      next: b => { this.bookings.set(b); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  color(initials: string) { return getInitialsColor(initials); }
  day(date: string) { return new Date(date).getUTCDate(); }
  month(date: string) { return new Date(date).toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' }).toUpperCase(); }
}
