import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LogoComponent } from './shared/components/logo.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LogoComponent],
  styles: [`
    @keyframes splashBar { from { width:0% } to { width:100% } }
    @keyframes fadeFloat { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
    .orb1 { animation: fadeFloat 4s ease-in-out infinite; }
    .orb2 { animation: fadeFloat 5.5s ease-in-out infinite reverse; }
    .orb3 { animation: fadeFloat 3.8s ease-in-out 0.8s infinite; }
  `],
  template: `
    <router-outlet />

    @if (splash()) {
      <div style="position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;
                  align-items:center;justify-content:center;overflow:hidden;
                  background:linear-gradient(145deg,oklch(0.10 0.025 250),oklch(0.15 0.04 230) 50%,oklch(0.12 0.03 200));
                  transition:opacity 0.55s ease,transform 0.55s ease"
           [style.opacity]="exiting() ? '0' : '1'"
           [style.transform]="exiting() ? 'scale(1.05)' : 'scale(1)'"
           [style.pointer-events]="exiting() ? 'none' : 'all'">

        <!-- Ambient orbs -->
        <div class="orb1" style="position:absolute;top:12%;left:8%;width:200px;height:200px;border-radius:50%;
             background:radial-gradient(circle,oklch(0.42 0.20 250 / 0.22),transparent 70%);pointer-events:none"></div>
        <div class="orb2" style="position:absolute;bottom:18%;right:6%;width:260px;height:260px;border-radius:50%;
             background:radial-gradient(circle,oklch(0.58 0.18 165 / 0.16),transparent 70%);pointer-events:none"></div>
        <div class="orb3" style="position:absolute;top:58%;left:4%;width:130px;height:130px;border-radius:50%;
             background:radial-gradient(circle,oklch(0.72 0.14 80 / 0.12),transparent 70%);pointer-events:none"></div>

        <!-- Grid overlay -->
        <svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.045;pointer-events:none">
          <defs>
            <pattern id="g" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M60 0L0 0 0 60" fill="none" stroke="white" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>

        <!-- Logo -->
        <div class="logo-in" style="margin-bottom:22px;filter:drop-shadow(0 0 48px oklch(0.42 0.20 250 / 0.65))">
          <app-logo size="xl" />
        </div>

        <!-- Tagline -->
        <div class="slide-up" style="animation-delay:0.32s;text-align:center;margin-bottom:52px">
          <div style="font-size:14px;font-weight:600;letter-spacing:0.10em;text-transform:uppercase;
                      color:oklch(0.68 0.07 250)">The marketplace for professionals</div>
        </div>

        <!-- Progress bar -->
        <div style="position:absolute;bottom:52px;width:100px">
          <div style="height:2px;border-radius:99px;background:oklch(0.25 0.04 250);overflow:hidden">
            <div style="height:100%;border-radius:99px;
                        background:linear-gradient(90deg,oklch(0.42 0.20 250),oklch(0.58 0.18 165));
                        animation:splashBar 1.6s cubic-bezier(0.4,0,0.2,1) 0.15s both"></div>
          </div>
        </div>
      </div>
    }
  `,
})
export class App implements OnInit {
  splash = signal(false);
  exiting = signal(false);

  ngOnInit() {
    if (sessionStorage.getItem('100pro_splash')) return;
    sessionStorage.setItem('100pro_splash', '1');
    this.splash.set(true);
    setTimeout(() => this.exiting.set(true), 1900);
    setTimeout(() => this.splash.set(false), 2480);
  }
}
