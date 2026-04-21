import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { Booking, getInitialsColor } from '../../shared/models';

const SEED: Booking[] = [
  { id: '1', clientId: '', providerId: '', serviceId: '', date: '2026-04-07', time: '10:00', finalPrice: 380, status: 'confirmed', createdAt: '', service: { id: '', providerId: '', name: 'Consultoria inicial', price: 380, duration: 60, category: 'reform', description: '' }, provider: { id: '', userId: '', role: 'Arquiteta', category: 'reform', bio: '', phone: '', city: '', verified: true, rating: 4.9, reviewsCount: 127, jobsCount: 341, user: { id: '', email: '', name: 'Carla Mendes', avatarInitials: 'CM', isProvider: true } } },
  { id: '2', clientId: '', providerId: '', serviceId: '', date: '2026-04-11', time: '14:00', finalPrice: 1000, status: 'confirmed', createdAt: '', service: { id: '', providerId: '', name: 'Sprint planning', price: 1000, duration: 120, category: 'tech', description: '' }, provider: { id: '', userId: '', role: 'Dev Full Stack', category: 'tech', bio: '', phone: '', city: '', verified: true, rating: 4.8, reviewsCount: 89, jobsCount: 210, user: { id: '', email: '', name: 'Lucas Ferreira', avatarInitials: 'LF', isProvider: true } } },
  { id: '3', clientId: '', providerId: '', serviceId: '', date: '2026-04-15', time: '09:30', finalPrice: 300, status: 'confirmed', createdAt: '', service: { id: '', providerId: '', name: 'Coloração', price: 300, duration: 90, category: 'beauty', description: '' }, provider: { id: '', userId: '', role: 'Cabeleireira', category: 'beauty', bio: '', phone: '', city: '', verified: true, rating: 5.0, reviewsCount: 203, jobsCount: 892, user: { id: '', email: '', name: 'Ana Paula Costa', avatarInitials: 'AP', isProvider: true } } },
  { id: '4', clientId: '', providerId: '', serviceId: '', date: '2026-04-18', time: '07:00', finalPrice: 130, status: 'confirmed', createdAt: '', service: { id: '', providerId: '', name: 'Treino funcional', price: 130, duration: 60, category: 'health', description: '' }, provider: { id: '', userId: '', role: 'Personal Trainer', category: 'health', bio: '', phone: '', city: '', verified: true, rating: 4.9, reviewsCount: 148, jobsCount: 430, user: { id: '', email: '', name: 'Priya Sharma', avatarInitials: 'PS', isProvider: true } } },
];

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="font-weight:800;font-size:20px">Meus Agendamentos</div>
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
          </div>
          <span class="badge badge-p">Confirmado</span>
        </div>
      }
      @if (bookings().length === 0) {
        <div class="card" style="padding:48px;text-align:center;color:var(--t3)">
          <div style="font-size:40px;margin-bottom:12px">📅</div>
          <div style="font-weight:600;font-size:16px">Nenhum agendamento</div>
          <div style="font-size:13px;margin-top:6px">Explore profissionais e agende seu primeiro serviço</div>
        </div>
      }
    </div>
  `,
})
export class ScheduleComponent implements OnInit {
  api = inject(ApiService);
  bookings = signal<Booking[]>(SEED);

  ngOnInit() {
    this.api.getBookings().subscribe({ next: (b) => { if (b.length) this.bookings.set(b); }, error: () => {} });
  }

  color(initials: string) { return getInitialsColor(initials); }
  day(date: string) { return new Date(date).getUTCDate(); }
  month(date: string) { return new Date(date).toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' }).toUpperCase(); }
}
