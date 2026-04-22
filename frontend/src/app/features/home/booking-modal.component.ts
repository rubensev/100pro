import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../../shared/components/avatar.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Service, Promo } from '../../shared/models';

@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  template: `
    <div class="overlay" (click)="close.emit()">
      <div class="pop card" style="width:100%;max-width:460px;overflow:hidden" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,var(--p),var(--ac));padding:16px 20px;display:flex;align-items:center;gap:12px">
          <app-avatar [initials]="providerInitials" color="rgba(255,255,255,0.25)" [size]="40" [border]="false" />
          <div>
            <div style="color:white;font-weight:800;font-size:15px">{{ providerName }}</div>
            <div style="color:rgba(255,255,255,0.75);font-size:12px">{{ providerRole }}</div>
          </div>
          <button (click)="close.emit()" style="margin-left:auto;color:rgba(255,255,255,0.8);font-size:22px;line-height:1;background:none;border:none;cursor:pointer">×</button>
        </div>

        <!-- Steps -->
        <div style="display:flex;padding:12px 20px 0;gap:6px">
          @for (s of steps; track s; let i = $index) {
            <div style="flex:1;text-align:center">
              <div style="height:3px;border-radius:99px;margin-bottom:4px;transition:var(--tr)"
                   [style.background]="i <= step() ? 'var(--p)' : 'var(--bo)'"></div>
              <span style="font-size:10px;font-weight:600" [style.color]="i <= step() ? 'var(--p)' : 'var(--t3)'">{{ s }}</span>
            </div>
          }
        </div>

        <div style="padding:14px 20px 20px;min-height:260px">
          <!-- Step 0: Pick service -->
          @if (step() === 0) {
            <p style="font-size:12px;color:var(--t2);margin-bottom:10px">Escolha o serviço:</p>
            <div style="display:flex;flex-direction:column;gap:8px">
              @for (svc of services; track svc.id) {
                <div (click)="pickService(svc)"
                     [style.border]="selSvc()?.id === svc.id ? '1.5px solid var(--p)' : '1.5px solid var(--bo)'"
                     [style.background]="selSvc()?.id === svc.id ? 'var(--px)' : 'var(--bg)'"
                     style="padding:11px 14px;border-radius:var(--rs);cursor:pointer;transition:var(--tr);display:flex;align-items:center;gap:10px">
                  <div style="flex:1">
                    <div style="font-weight:700;font-size:13px">{{ svc.name }}</div>
                    <div style="font-size:11px;color:var(--t3);margin-top:1px">{{ svc.duration }} min</div>
                  </div>
                  <div style="text-align:right">
                    <div style="font-weight:700;font-size:14px;color:var(--p)">R$ {{ svc.price }}</div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Step 1: Pick date/time -->
          @if (step() === 1) {
            <p style="font-size:12px;color:var(--t2);margin-bottom:10px">Escolha o dia:</p>
            <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:12px">
              @for (d of days; track d.full) {
                <button (click)="selDay.set(d)"
                        [style.border]="selDay()?.full === d.full ? '1.5px solid var(--p)' : '1.5px solid var(--bo)'"
                        [style.background]="selDay()?.full === d.full ? 'var(--p)' : 'var(--bg)'"
                        [style.color]="selDay()?.full === d.full ? 'white' : 'var(--t)'"
                        style="flex-shrink:0;width:46px;border-radius:var(--rs);padding:7px 0;font-weight:600;font-size:13px;cursor:pointer;transition:var(--tr)">
                  <div style="font-size:9px;font-weight:500;opacity:0.7">{{ d.month }}</div>{{ d.day }}
                </button>
              }
            </div>
            @if (selDay()?.full) {
              <p style="font-size:12px;color:var(--t2);margin-bottom:8px">Escolha o horário:</p>
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
                @for (t of times; track t) {
                  <button (click)="pickTime(t)"
                          [style.border]="selTime() === t ? '1.5px solid var(--p)' : '1.5px solid var(--bo)'"
                          [style.background]="selTime() === t ? 'var(--p)' : 'var(--bg)'"
                          [style.color]="selTime() === t ? 'white' : 'var(--t)'"
                          style="padding:7px;border-radius:var(--rs);font-weight:600;font-size:12px;cursor:pointer;transition:var(--tr)">
                    {{ t }}
                  </button>
                }
              </div>
            }
          }

          <!-- Step 2: Confirm -->
          @if (step() === 2) {
            <div style="text-align:center;padding:10px 0">
              <div style="font-size:40px;margin-bottom:12px">🎉</div>
              <div style="font-weight:800;font-size:18px;margin-bottom:4px">Agendamento confirmado!</div>
              <div style="font-size:13px;color:var(--t2);line-height:1.6;margin-bottom:16px">
                <strong>{{ selSvc()?.name }}</strong><br>
                com <strong>{{ providerName }}</strong><br>
                dia <strong>{{ selDay()?.day }} de {{ selDay()?.month }}</strong> às <strong>{{ selTime() }}</strong>
              </div>
              <div style="background:var(--px);border-radius:var(--rs);padding:10px 16px;display:inline-flex;gap:8px;align-items:center">
                <span style="font-size:13px;font-weight:700;color:var(--p)">R$ {{ selSvc()?.price }}</span>
              </div>
              <div style="margin-top:16px">
                <button class="btn btn-p" style="width:100%" (click)="close.emit()">Ir para Agendamentos</button>
              </div>
            </div>
          }
        </div>

        @if (step() > 0 && step() < 2) {
          <div style="padding:0 20px 16px;display:flex;gap:8px">
            <button class="btn btn-g" (click)="step.set(step() - 1)">← Voltar</button>
          </div>
        }
      </div>
    </div>
  `,
})
export class BookingModalComponent {
  @Input() providerName = '';
  @Input() providerRole = '';
  @Input() providerInitials = '';
  @Input() providerId = '';
  @Input() services: Service[] = [];
  @Output() close = new EventEmitter<void>();

  api = inject(ApiService);
  auth = inject(AuthService);

  step = signal(0);
  selSvc = signal<Service | null>(null);
  selDay = signal<{ day: number; month: string; full: string } | null>(null);
  selTime = signal<string | null>(null);

  steps = ['Serviço', 'Horário', 'Confirmar'];
  days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return { day: d.getDate(), month: d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(), full: d.toISOString().split('T')[0] };
  });
  times = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  pickService(svc: Service) {
    this.selSvc.set(svc);
    this.step.set(1);
  }

  pickTime(t: string) {
    this.selTime.set(t);
    this.step.set(2);
    if (this.auth.isLoggedIn()) {
      this.api.createBooking({
        providerId: this.providerId,
        serviceId: this.selSvc()?.id,
        date: this.selDay()?.full,
        time: t,
        finalPrice: this.selSvc()?.price,
      }).subscribe();
    }
  }
}
