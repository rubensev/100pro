import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/components/avatar.component';
import { BookingModalComponent } from '../home/booking-modal.component';
import { Store, Service, ProviderProfile, getInitialsColor } from '../../shared/models';
import { TranslationService } from '../../i18n/translation.service';

const API_BASE = 'http://localhost:3000';

@Component({
  selector: 'app-store-page',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent, BookingModalComponent],
  template: `
    @if (loading()) {
      <div style="display:flex;align-items:center;justify-content:center;min-height:60vh">
        <svg class="spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--p)" stroke-width="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
        </svg>
      </div>
    } @else if (store()) {
      <div style="margin:-22px -26px 0" [class.mobile-margin]="true">

        <!-- Cover + branding header -->
        <div style="position:relative;min-height:200px;overflow:hidden"
             [style.background]="store()!.backgroundColor || 'linear-gradient(135deg,var(--p),var(--ac))'">
          @if (store()!.coverUrl) {
            <img [src]="API_BASE + store()!.coverUrl"
                 style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block" />
            <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.55))"></div>
          }

          <!-- Store logo + name overlay -->
          <div style="position:absolute;bottom:0;left:0;right:0;padding:20px 20px 24px;display:flex;align-items:flex-end;gap:14px">
            @if (store()!.logoUrl) {
              <img [src]="API_BASE + store()!.logoUrl"
                   style="width:72px;height:72px;border-radius:16px;object-fit:cover;
                          border:3px solid white;box-shadow:0 4px 16px rgba(0,0,0,0.25);flex-shrink:0" />
            } @else {
              <div style="width:72px;height:72px;border-radius:16px;background:rgba(255,255,255,0.2);
                          border:3px solid rgba(255,255,255,0.5);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5">
                  <path d="M2 7h20v14H2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
            }
            <div>
              <div style="font-size:22px;font-weight:800;color:white;text-shadow:0 2px 8px rgba(0,0,0,0.4)">
                {{ store()!.name }}
              </div>
              @if (store()!.category) {
                <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:2px;font-weight:500">
                  {{ store()!.category }}
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Description -->
        @if (store()!.description) {
          <div style="padding:16px 20px;background:var(--ca);border-bottom:1px solid var(--bo)">
            <p style="font-size:13px;color:var(--t2);line-height:1.65">{{ store()!.description }}</p>
          </div>
        }

        <!-- Members section -->
        <div style="padding:20px">
          <div style="font-weight:800;font-size:16px;margin-bottom:16px;color:var(--t)">
            Our Team
            <span style="font-size:13px;font-weight:500;color:var(--t3);margin-left:6px">
              {{ members().length }} {{ members().length === 1 ? 'professional' : 'professionals' }}
            </span>
          </div>

          @if (members().length === 0) {
            <div style="text-align:center;padding:32px;color:var(--t3);font-size:13px">
              No team members yet
            </div>
          }

          <div style="display:flex;flex-direction:column;gap:16px">
            @for (member of members(); track member.id) {
              <div class="card slide-up" style="overflow:hidden">
                <!-- Member header -->
                <div style="padding:14px 16px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--bo)">
                  @if (member.user?.avatarUrl) {
                    <img [src]="API_BASE + member.user!.avatarUrl"
                         style="width:46px;height:46px;border-radius:50%;object-fit:cover;flex-shrink:0" />
                  } @else {
                    <app-avatar [initials]="member.user?.avatarInitials || '?'"
                                [color]="memberColor(member)" [size]="46" />
                  }
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:700;font-size:14px;color:var(--t)">{{ member.user?.name }}</div>
                    <div style="font-size:12px;color:var(--t3);margin-top:1px">{{ member.role || member.category }}</div>
                    @if (member.rating) {
                      <div style="font-size:11px;color:var(--t3);margin-top:2px">
                        ⭐ {{ member.rating }} · {{ member.reviewsCount }} reviews
                      </div>
                    }
                  </div>
                  <a [routerLink]="['/p', member.id]"
                     style="font-size:11px;font-weight:600;color:var(--p);text-decoration:none;
                            padding:6px 12px;border-radius:99px;border:1px solid var(--p);
                            transition:var(--tr);white-space:nowrap;flex-shrink:0"
                     (mouseenter)="$any($event.currentTarget).style.background='var(--p)';$any($event.currentTarget).style.color='white'"
                     (mouseleave)="$any($event.currentTarget).style.background='transparent';$any($event.currentTarget).style.color='var(--p)'">
                    View profile
                  </a>
                </div>

                <!-- Member services at this store -->
                @if (memberServices(member.id).length > 0) {
                  <div style="padding:12px 16px">
                    <div style="font-size:11px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">
                      Services at this store
                    </div>
                    <div style="display:flex;flex-direction:column;gap:6px">
                      @for (svc of memberServices(member.id); track svc.id) {
                        <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;
                                    border-radius:var(--rs);background:var(--bg);border:1px solid var(--bo)">
                          <div style="flex:1;min-width:0">
                            <div style="font-weight:600;font-size:13px;color:var(--t)">{{ svc.name }}</div>
                            @if (svc.duration) {
                              <div style="font-size:11px;color:var(--t3)">{{ svc.duration }} min</div>
                            }
                          </div>
                          <div style="font-weight:700;font-size:13px;color:var(--p);white-space:nowrap">
                            R$ {{ svc.price }}
                          </div>
                          <button (click)="book(member, svc)"
                                  class="btn btn-p" style="padding:6px 12px;font-size:11px;white-space:nowrap">
                            Book
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Owner section (if not already in members) -->
          @if (ownerProfile() && !isMember(ownerProfile()!.id)) {
            <div style="margin-top:16px">
              <div style="font-weight:700;font-size:13px;color:var(--t3);margin-bottom:8px">Owner</div>
              <div class="card" style="overflow:hidden">
                <div style="padding:14px 16px;display:flex;align-items:center;gap:12px">
                  @if (ownerProfile()!.user?.avatarUrl) {
                    <img [src]="API_BASE + ownerProfile()!.user!.avatarUrl"
                         style="width:46px;height:46px;border-radius:50%;object-fit:cover;flex-shrink:0" />
                  } @else {
                    <app-avatar [initials]="ownerProfile()!.user?.avatarInitials || '?'"
                                [color]="memberColor(ownerProfile()!)" [size]="46" />
                  }
                  <div style="flex:1">
                    <div style="font-weight:700;font-size:14px">{{ ownerProfile()!.user?.name }}</div>
                    <div style="font-size:12px;color:var(--t3)">{{ ownerProfile()!.role || ownerProfile()!.category }}</div>
                  </div>
                  <a [routerLink]="['/p', ownerProfile()!.id]"
                     style="font-size:11px;font-weight:600;color:var(--p);text-decoration:none;
                            padding:6px 12px;border-radius:99px;border:1px solid var(--p)">
                    View profile
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    } @else {
      <div style="text-align:center;padding:64px 24px;color:var(--t3)">Store not found</div>
    }

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
export class StorePageComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  route = inject(ActivatedRoute);
  i18n = inject(TranslationService);

  API_BASE = API_BASE;
  store = signal<Store | null>(null);
  storeServices = signal<Service[]>([]);
  loading = signal(true);
  bookingTarget = signal<{ name: string; role: string; initials: string; id: string; services: Service[] } | null>(null);

  members = computed(() => this.store()?.members ?? []);
  ownerProfile = computed(() => this.store()?.provider ?? null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getPublicStore(id).subscribe({
      next: s => {
        this.store.set(s);
        this.loading.set(false);
        this.api.getServicesByStore(id).subscribe({
          next: svcs => this.storeServices.set(svcs),
          error: () => {},
        });
      },
      error: () => this.loading.set(false),
    });
  }

  memberServices(providerId: string) {
    return this.storeServices().filter(s => s.providerId === providerId);
  }

  isMember(providerId: string) {
    return this.members().some(m => m.id === providerId);
  }

  memberColor(member: ProviderProfile) {
    return getInitialsColor(member.user?.avatarInitials || '');
  }

  book(member: ProviderProfile, preselect: Service) {
    this.bookingTarget.set({
      name: member.user?.name || '',
      role: member.role || member.category || '',
      initials: member.user?.avatarInitials || '',
      id: member.id,
      services: this.memberServices(member.id),
    });
  }
}
