import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface AppNotification {
  id: string;
  type: 'message' | 'booking';
  title: string;
  body: string;
  route: string;
  time: Date;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService implements OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  unreadMessages  = signal(0);
  upcomingBookings = signal(0);
  incomingBookings = signal(0);
  items = signal<AppNotification[]>([]);
  panelOpen = signal(false);

  unreadCount = computed(() => this.items().filter(n => !n.read).length);

  private timer: ReturnType<typeof setInterval> | null = null;
  private prevMessages = 0;
  private prevIncoming = 0;
  private idSeq = 0;

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

  togglePanel() { this.panelOpen.update(v => !v); }
  closePanel() { this.panelOpen.set(false); }

  markRead(id: string) {
    this.items.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
  }

  markAllRead() {
    this.items.update(list => list.map(n => ({ ...n, read: true })));
  }

  clearAll() { this.items.set([]); }

  navigateTo(notif: AppNotification) {
    this.markRead(notif.id);
    this.panelOpen.set(false);
    this.router.navigate([notif.route]);
  }

  requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  timeAgo(date: Date): string {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 60) return 'agora';
    if (s < 3600) return `${Math.floor(s / 60)} min`;
    if (s < 86400) return `${Math.floor(s / 3600)} h`;
    return `${Math.floor(s / 86400)} d`;
  }

  private push(type: AppNotification['type'], title: string, body: string, route: string) {
    const notif: AppNotification = {
      id: String(++this.idSeq),
      type, title, body, route,
      time: new Date(),
      read: false,
    };
    this.items.update(list => [notif, ...list].slice(0, 30));
    this.browserNotify(title, body, route);
  }

  private browserNotify(title: string, body: string, route: string) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const n = new Notification(title, { body, icon: '/favicon.ico', tag: route });
    n.onclick = () => { window.focus(); this.router.navigate([route]); n.close(); };
  }

  private poll() {
    if (!this.auth.isLoggedIn()) return;

    this.api.getUnreadCount().subscribe({
      next: ({ count }) => {
        if (count > this.prevMessages) {
          const diff = count - this.prevMessages;
          this.push('message',
            `${diff} nova${diff > 1 ? 's' : ''} mensagem${diff > 1 ? 's' : ''}`,
            'Tens mensagens por ler',
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
          if (count > this.prevIncoming) {
            const diff = count - this.prevIncoming;
            this.push('booking',
              `${diff} nova${diff > 1 ? 's' : ''} marcação${diff > 1 ? 'ões' : ''}`,
              'Tens novos pedidos de marcação',
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
