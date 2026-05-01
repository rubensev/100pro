import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationsService implements OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  unreadMessages = signal(0);
  upcomingBookings = signal(0);
  incomingBookings = signal(0);

  private timer: ReturnType<typeof setInterval> | null = null;
  private prevMessages = 0;
  private prevIncoming = 0;

  start() {
    this.requestPermission();
    this.poll();
    this.timer = setInterval(() => this.poll(), 10000);
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.unreadMessages.set(0);
    this.upcomingBookings.set(0);
    this.incomingBookings.set(0);
    this.prevMessages = 0;
    this.prevIncoming = 0;
  }

  refresh() { this.poll(); }
  decrementMessages() { this.unreadMessages.update(n => Math.max(0, n - 1)); }
  clearIncoming() { this.incomingBookings.set(0); }

  requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  private notify(title: string, body: string, route: string) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const n = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: route,
    });
    n.onclick = () => {
      window.focus();
      this.router.navigate([route]);
      n.close();
    };
  }

  private poll() {
    if (!this.auth.isLoggedIn()) return;

    this.api.getUnreadCount().subscribe({
      next: ({ count }) => {
        if (count > this.prevMessages && this.prevMessages >= 0) {
          const diff = count - this.prevMessages;
          this.notify(
            `${diff} nova${diff > 1 ? 's' : ''} mensagem${diff > 1 ? 's' : ''}`,
            'Tem mensagens por ler',
            '/messages'
          );
        }
        this.prevMessages = count;
        this.unreadMessages.set(count);
      },
      error: () => {},
    });

    this.api.getUpcomingCount().subscribe({ next: ({ count }) => this.upcomingBookings.set(count), error: () => {} });

    if (this.auth.user()?.isProvider) {
      this.api.getIncomingCount().subscribe({
        next: ({ count }) => {
          if (count > this.prevIncoming && this.prevIncoming >= 0) {
            const diff = count - this.prevIncoming;
            this.notify(
              `${diff} nova${diff > 1 ? 's' : ''} marcação${diff > 1 ? 'ões' : ''}`,
              'Tem novos pedidos de marcação',
              '/schedule'
            );
          }
          this.prevIncoming = count;
          this.incomingBookings.set(count);
        },
        error: () => {},
      });
    }
  }

  ngOnDestroy() { this.stop(); }
}
