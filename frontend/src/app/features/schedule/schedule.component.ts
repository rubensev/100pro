import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Booking, getInitialsColor } from '../../shared/models';
import { TranslationService } from '../../i18n/translation.service';
import { AvatarComponent } from '../../shared/components/avatar.component';
import { StarsComponent } from '../../shared/components/stars.component';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent, StarsComponent],
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
            <div class="card" style="padding:13px 16px;display:flex;gap:14px;align-items:center"
                 [style.opacity]="ev.status === 'cancelled' ? '0.6' : '1'"
                 [style.border-left]="'4px solid ' + (ev.status === 'completed' ? 'var(--ac)' : 'var(--bo)')">
              <div style="text-align:center;min-width:38px">
                <div style="font-weight:800;font-size:22px;line-height:1">{{ day(ev.date) }}</div>
                <div style="font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:0.06em">{{ month(ev.date) }}</div>
              </div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:14px">{{ ev.service?.name }}</div>
                <div style="font-size:12px;color:var(--t2);margin-top:1px">{{ ev.provider?.user?.name }} · {{ ev.time }}</div>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
                <span class="badge badge-g" style="font-size:11px">
                  {{ ev.status === 'completed' ? i18n.t('schedule.status.completed') : i18n.t('schedule.status.cancelled') }}
                </span>
                @if (ev.status === 'completed' && !reviewed()[ev.id]) {
                  <button class="btn btn-g" style="font-size:11px;padding:4px 10px" (click)="openReview(ev)">
                    ⭐ {{ i18n.t('schedule.review') }}
                  </button>
                }
                @if (reviewed()[ev.id]) {
                  <span style="font-size:11px;color:var(--ac)">✓ {{ i18n.t('schedule.reviewed') }}</span>
                }
              </div>
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

    <!-- Review modal -->
    @if (reviewTarget()) {
      <div class="overlay" (click)="reviewTarget.set(null)">
        <div class="pop card" style="width:100%;max-width:420px;padding:24px" (click)="$event.stopPropagation()">
          <div style="font-weight:800;font-size:17px;margin-bottom:4px">{{ i18n.t('review.title') }}</div>
          <div style="font-size:13px;color:var(--t2);margin-bottom:18px">{{ reviewTarget()!.provider?.user?.name }} · {{ reviewTarget()!.service?.name }}</div>

          <!-- Star selector -->
          <div style="display:flex;gap:6px;margin-bottom:16px;justify-content:center">
            @for (s of [1,2,3,4,5]; track s) {
              <button (click)="reviewRating = s" style="background:none;border:none;cursor:pointer;font-size:32px;transition:transform 0.1s"
                      [style.transform]="s <= reviewRating ? 'scale(1.15)' : 'scale(1)'">
                {{ s <= reviewRating ? '⭐' : '☆' }}
              </button>
            }
          </div>

          <div class="field" style="margin-bottom:16px">
            <label>{{ i18n.t('review.comment') }}</label>
            <textarea [(ngModel)]="reviewText" [placeholder]="i18n.t('review.placeholder')" style="min-height:80px"></textarea>
          </div>

          @if (reviewError()) { <div style="color:var(--re);font-size:12px;margin-bottom:8px">{{ reviewError() }}</div> }

          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn btn-g" (click)="reviewTarget.set(null)">{{ i18n.t('common.cancel') }}</button>
            <button class="btn btn-p" (click)="submitReview()" [style.opacity]="reviewRating > 0 ? '1' : '0.5'">{{ i18n.t('review.submit') }}</button>
          </div>
        </div>
      </div>
    }
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

  reviewed = signal<Record<string, boolean>>({});
  reviewTarget = signal<Booking | null>(null);
  reviewRating = 0;
  reviewText = '';
  reviewError = signal('');

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

  openReview(booking: Booking) {
    this.reviewTarget.set(booking);
    this.reviewRating = 0;
    this.reviewText = '';
    this.reviewError.set('');
  }

  submitReview() {
    const b = this.reviewTarget();
    if (!b || this.reviewRating < 1) return;
    this.reviewError.set('');
    this.api.createReview({ providerId: b.providerId, bookingId: b.id, rating: this.reviewRating, text: this.reviewText.trim() || undefined }).subscribe({
      next: () => {
        this.reviewed.update(r => ({ ...r, [b.id]: true }));
        this.reviewTarget.set(null);
      },
      error: (e) => this.reviewError.set(e.error?.message || 'Erro ao enviar avaliação.'),
    });
  }

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
