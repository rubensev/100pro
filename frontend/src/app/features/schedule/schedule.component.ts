import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Booking, getInitialsColor } from '../../shared/models';
import { TranslationService } from '../../i18n/translation.service';
import { AvatarComponent } from '../../shared/components/avatar.component';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  template: `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="font-weight:800;font-size:20px">{{ i18n.t('schedule.title') }}</div>

      <!-- Tab bar -->
      @if (auth.user()?.isProvider) {
        <div style="display:flex;gap:4px;background:var(--ca);border-radius:var(--r);padding:5px;border:1px solid var(--bo)">
          <button (click)="tab='mine'" [style.background]="tab==='mine' ? 'var(--p)' : 'transparent'" [style.color]="tab==='mine' ? 'white' : 'var(--t2)'"
                  style="flex:1;padding:8px;border-radius:var(--rs);border:none;font-weight:600;font-size:13px;cursor:pointer;transition:var(--tr)">
            {{ i18n.t('schedule.tab.mine') }}
          </button>
          <button (click)="tab='incoming';loadIncoming()" [style.background]="tab==='incoming' ? 'var(--p)' : 'transparent'" [style.color]="tab==='incoming' ? 'white' : 'var(--t2)'"
                  style="flex:1;padding:8px;border-radius:var(--rs);border:none;font-weight:600;font-size:13px;cursor:pointer;transition:var(--tr)">
            {{ i18n.t('schedule.tab.incoming') }}
            @if (incoming().length > 0) {
              <span style="background:white;color:var(--p);border-radius:99px;padding:0 6px;font-size:10px;margin-left:4px;font-weight:700">{{ incoming().length }}</span>
            }
          </button>
        </div>
      }

      @if (loading()) {
        <div style="text-align:center;padding:40px;color:var(--t3)">
          <div style="font-size:24px;margin-bottom:8px">⏳</div>
          <div style="font-size:13px">{{ i18n.t('schedule.loading') }}</div>
        </div>
      }

      <!-- My bookings tab -->
      @if (!loading() && tab === 'mine') {
        <!-- Upcoming -->
        @if (upcoming().length > 0) {
          <div style="font-weight:700;font-size:13px;color:var(--t2);text-transform:uppercase;letter-spacing:0.05em;margin-top:4px">
            {{ i18n.t('schedule.section.upcoming') }} ({{ upcoming().length }})
          </div>
          @for (ev of upcoming(); track ev.id; let i = $index) {
            <div class="card fu" [style.animation-delay]="i * 0.05 + 's'"
                 style="padding:13px 16px;display:flex;gap:14px;align-items:center;border-left:4px solid var(--p)">
              <div style="text-align:center;min-width:38px">
                <div style="font-weight:800;font-size:22px;line-height:1">{{ day(ev.date) }}</div>
                <div style="font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:0.06em">{{ month(ev.date) }}</div>
              </div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:14px">{{ ev.service?.name }}</div>
                <div style="font-size:12px;color:var(--t2);margin-top:1px">{{ ev.provider?.user?.name }} · {{ ev.time }}</div>
                @if (ev.finalPrice) { <div style="font-size:12px;color:var(--p);font-weight:600;margin-top:2px">R$ {{ ev.finalPrice }}</div> }
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
                <span class="badge badge-p" style="font-size:11px">{{ i18n.t('schedule.status.confirmed') }}</span>
                <button class="btn btn-danger" style="font-size:11px;padding:4px 10px" (click)="cancel(ev)">{{ i18n.t('schedule.cancel') }}</button>
              </div>
            </div>
          }
        }

        <!-- Past -->
        @if (past().length > 0) {
          <div style="font-weight:700;font-size:13px;color:var(--t2);text-transform:uppercase;letter-spacing:0.05em;margin-top:8px">
            {{ i18n.t('schedule.section.past') }}
          </div>
          @for (ev of past(); track ev.id) {
            <div class="card" style="padding:13px 16px;display:flex;gap:14px;align-items:center;opacity:0.7"
                 [style.border-left]="'4px solid ' + (ev.status === 'completed' ? 'var(--ac)' : 'var(--bo)')">
              <div style="text-align:center;min-width:38px">
                <div style="font-weight:800;font-size:22px;line-height:1">{{ day(ev.date) }}</div>
                <div style="font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:0.06em">{{ month(ev.date) }}</div>
              </div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:14px">{{ ev.service?.name }}</div>
                <div style="font-size:12px;color:var(--t2);margin-top:1px">{{ ev.provider?.user?.name }} · {{ ev.time }}</div>
              </div>
              <span class="badge badge-g" style="font-size:11px">
                {{ ev.status === 'completed' ? i18n.t('schedule.status.completed') : i18n.t('schedule.status.cancelled') }}
              </span>
            </div>
          }
        }

        @if (bookings().length === 0) {
          <div class="card" style="padding:48px;text-align:center;color:var(--t3)">
            <div style="font-size:40px;margin-bottom:12px">📅</div>
            <div style="font-weight:600;font-size:16px">{{ i18n.t('schedule.empty.title') }}</div>
            <div style="font-size:13px;margin-top:6px">{{ i18n.t('schedule.empty.sub') }}</div>
          </div>
        }
      }

      <!-- Incoming bookings tab (providers) -->
      @if (!loading() && tab === 'incoming') {
        @for (ev of incomingUpcoming(); track ev.id; let i = $index) {
          <div class="card fu" [style.animation-delay]="i * 0.05 + 's'"
               style="padding:13px 16px;display:flex;gap:14px;align-items:center"
               [style.border-left]="'4px solid ' + color(ev.client?.avatarInitials || '')">
            <app-avatar [initials]="ev.client?.avatarInitials || '?'" [color]="color(ev.client?.avatarInitials || '')" [size]="40" />
            <div style="flex:1">
              <div style="font-weight:700;font-size:14px">{{ ev.client?.name }}</div>
              <div style="font-size:12px;color:var(--t2);margin-top:1px">{{ ev.service?.name }} · {{ ev.time }}</div>
              <div style="font-size:12px;font-weight:600;color:var(--p);margin-top:2px">{{ day(ev.date) }} {{ month(ev.date) }}</div>
            </div>
            <span class="badge badge-p" style="font-size:11px">{{ i18n.t('schedule.status.confirmed') }}</span>
          </div>
        }
        @if (incoming().length === 0) {
          <div class="card" style="padding:48px;text-align:center;color:var(--t3)">
            <div style="font-size:40px;margin-bottom:12px">📥</div>
            <div style="font-weight:600;font-size:16px">{{ i18n.t('schedule.incoming.empty') }}</div>
          </div>
        }
      }
    </div>
  `,
})
export class ScheduleComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  i18n = inject(TranslationService);

  bookings = signal<Booking[]>([]);
  incoming = signal<any[]>([]);
  loading = signal(true);
  tab = 'mine';
  incomingLoaded = false;

  ngOnInit() {
    this.api.getBookings().subscribe({
      next: b => { this.bookings.set(b); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadIncoming() {
    if (this.incomingLoaded) return;
    this.incomingLoaded = true;
    this.api.getIncomingBookings().subscribe({ next: b => this.incoming.set(b), error: () => {} });
  }

  upcoming = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.bookings().filter(b => b.status === 'confirmed' && b.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  });

  past = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.bookings().filter(b => b.status !== 'confirmed' || b.date < today).sort((a, b) => b.date.localeCompare(a.date));
  });

  incomingUpcoming = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.incoming().filter(b => b.status === 'confirmed' && b.date >= today).sort((a: any, b: any) => a.date.localeCompare(b.date));
  });

  cancel(booking: Booking) {
    this.api.cancelBooking(booking.id).subscribe({
      next: updated => this.bookings.update(bs => bs.map(b => b.id === updated.id ? updated : b)),
      error: () => {},
    });
  }

  color(initials: string) { return getInitialsColor(initials); }
  day(date: string) { return new Date(date).getUTCDate(); }
  month(date: string) { return new Date(date).toLocaleString(this.i18n.locale, { month: 'short', timeZone: 'UTC' }).toUpperCase(); }
}
