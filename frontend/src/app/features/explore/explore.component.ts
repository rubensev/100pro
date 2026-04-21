import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/components/avatar.component';
import { StarsComponent } from '../../shared/components/stars.component';
import { BookingModalComponent } from '../home/booking-modal.component';
import { CATEGORIES, getInitialsColor, Service } from '../../shared/models';

const SEED_PROVIDERS = [
  { id: '1', name: 'Carla Mendes', role: 'Arquiteta & Designer', category: 'reform', rating: 4.9, reviewsCount: 127, jobsCount: 341, price: 180, initials: 'CM', verified: true },
  { id: '2', name: 'Lucas Ferreira', role: 'Dev Full Stack', category: 'tech', rating: 4.8, reviewsCount: 89, jobsCount: 210, price: 150, initials: 'LF', verified: true },
  { id: '3', name: 'Ana Paula Costa', role: 'Cabeleireira & Colorista', category: 'beauty', rating: 5.0, reviewsCount: 203, jobsCount: 892, price: 120, initials: 'AP', verified: true },
  { id: '4', name: 'Roberto Silva', role: 'Fotógrafo', category: 'photo', rating: 4.7, reviewsCount: 65, jobsCount: 156, price: 250, initials: 'RS', verified: false },
  { id: '5', name: 'Priya Sharma', role: 'Personal Trainer', category: 'health', rating: 4.9, reviewsCount: 148, jobsCount: 430, price: 130, initials: 'PS', verified: true },
  { id: '6', name: 'Marcos Oliveira', role: 'Designer Gráfico & UX', category: 'design', rating: 4.8, reviewsCount: 92, jobsCount: 275, price: 160, initials: 'MO', verified: true },
];

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, AvatarComponent, StarsComponent, BookingModalComponent],
  template: `
    <div style="display:flex;flex-direction:column;gap:14px">
      <!-- Category filter -->
      <div style="display:flex;gap:7px;overflow-x:auto;padding-bottom:2px">
        @for (c of cats; track c.id) {
          <button (click)="selCat = c.id"
                  [style.background]="selCat === c.id ? 'var(--p)' : 'var(--ca)'"
                  [style.color]="selCat === c.id ? 'white' : 'var(--t2)'"
                  [style.border]="selCat === c.id ? '1px solid var(--p)' : '1px solid var(--bo)'"
                  style="flex-shrink:0;padding:7px 13px;border-radius:99px;font-size:12px;font-weight:600;cursor:pointer;transition:var(--tr)">
            {{ c.icon }} {{ c.label }}
          </button>
        }
      </div>

      <!-- Provider grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px">
        @for (p of filtered(); track p.id; let i = $index) {
          <div class="fu" style="background:var(--ca);border-radius:var(--r);border:1px solid var(--bo);overflow:hidden;transition:var(--tr)"
               [style.animation-delay]="i * 0.05 + 's'"
               (mouseenter)="$any($event.currentTarget).style.transform='translateY(-3px)';$any($event.currentTarget).style.boxShadow='var(--shm)'"
               (mouseleave)="$any($event.currentTarget).style.transform='none';$any($event.currentTarget).style.boxShadow='var(--sh)'">
            <!-- Color band -->
            <div [style.background]="'linear-gradient(135deg,' + color(p.initials) + '66,' + color(p.initials) + '22)'" style="height:70px;position:relative">
              <button (click)="toggleFav(p.id)"
                      [style.background]="favs()[p.id] ? 'oklch(0.95 0.08 25)' : 'var(--bg2)'"
                      style="position:absolute;top:8px;right:8px;width:30px;height:30px;border-radius:50%;border:none;cursor:pointer;transition:var(--tr);display:flex;align-items:center;justify-content:center">
                <svg width="15" height="15" viewBox="0 0 24 24" [attr.fill]="favs()[p.id] ? 'var(--re)' : 'none'" [attr.stroke]="favs()[p.id] ? 'var(--re)' : 'var(--t3)'" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>

            <div style="padding:0 16px 16px;margin-top:-22px">
              <div style="position:relative;display:inline-block;margin-bottom:8px">
                <app-avatar [initials]="p.initials" [color]="color(p.initials)" [size]="46" />
                @if (p.verified) {
                  <div style="position:absolute;bottom:0;right:0;width:14px;height:14px;background:var(--ac);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white">
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
                  </div>
                }
              </div>
              <div style="font-weight:700;font-size:14px">{{ p.name }}</div>
              <div style="font-size:12px;color:var(--t2);margin-top:1px">{{ p.role }}</div>
              <div style="display:flex;align-items:center;gap:5px;margin:5px 0 8px">
                <app-stars [rating]="p.rating" [size]="11" />
                <span style="font-size:11px;font-weight:700">{{ p.rating }}</span>
                <span style="font-size:10px;color:var(--t3)">({{ p.reviewsCount }})</span>
              </div>
              <div style="display:flex;gap:6px;margin-bottom:10px">
                <span class="badge badge-p">R$ {{ p.price }}/h</span>
                <span class="badge badge-g">{{ p.jobsCount }} jobs</span>
              </div>
              <button class="btn btn-p" style="width:100%;padding:8px;font-size:13px"
                (click)="requireAuth(() => book(p))">
                Agendar agora
              </button>
            </div>
          </div>
        }
      </div>
    </div>

    @if (bookingTarget()) {
      <app-booking-modal
        [providerName]="bookingTarget()!.name"
        [providerRole]="bookingTarget()!.role"
        [providerInitials]="bookingTarget()!.initials"
        [providerId]="bookingTarget()!.id"
        [services]="bookingTarget()!.services"
        (close)="bookingTarget.set(null)" />
    }
  `,
})
export class ExploreComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  router = inject(Router);

  cats = CATEGORIES;
  selCat = 'all';
  providers = signal(SEED_PROVIDERS);
  favs = signal<Record<string, boolean>>({});
  bookingTarget = signal<{ name: string; role: string; initials: string; id: string; services: Service[] } | null>(null);

  ngOnInit() {
    this.api.getProviders().subscribe({
      next: (ps) => {
        if (ps.length) {
          this.providers.set(ps.map(p => ({
            id: p.id, name: p.user?.name || '', role: p.role, category: p.category,
            rating: p.rating, reviewsCount: p.reviewsCount, jobsCount: p.jobsCount,
            price: 0, initials: p.user?.avatarInitials || '', verified: p.verified,
          })));
        }
      },
      error: () => {},
    });
  }

  filtered = () => this.providers().filter(p => this.selCat === 'all' || p.category === this.selCat);
  color(initials: string) { return getInitialsColor(initials); }

  toggleFav(id: string) { this.favs.update(f => ({ ...f, [id]: !f[id] })); }

  requireAuth(fn: () => void) {
    if (this.auth.isLoggedIn()) fn();
    else this.router.navigate(['/auth/login']);
  }

  book(p: any) {
    this.bookingTarget.set({ name: p.name, role: p.role, initials: p.initials, id: p.id, services: [] });
  }
}
