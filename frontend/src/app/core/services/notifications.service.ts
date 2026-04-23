import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationsService implements OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  unreadMessages = signal(0);
  upcomingBookings = signal(0);
  incomingBookings = signal(0);

  private timer: ReturnType<typeof setInterval> | null = null;

  start() {
    this.poll();
    this.timer = setInterval(() => this.poll(), 30000);
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.unreadMessages.set(0);
    this.upcomingBookings.set(0);
    this.incomingBookings.set(0);
  }

  decrementMessages() { this.unreadMessages.update(n => Math.max(0, n - 1)); }
  clearIncoming() { this.incomingBookings.set(0); }

  private poll() {
    if (!this.auth.isLoggedIn()) return;
    this.api.getUnreadCount().subscribe({ next: ({ count }) => this.unreadMessages.set(count), error: () => {} });
    this.api.getUpcomingCount().subscribe({ next: ({ count }) => this.upcomingBookings.set(count), error: () => {} });
    if (this.auth.user()?.isProvider) {
      this.api.getIncomingCount().subscribe({ next: ({ count }) => this.incomingBookings.set(count), error: () => {} });
    }
  }

  ngOnDestroy() { this.stop(); }
}
