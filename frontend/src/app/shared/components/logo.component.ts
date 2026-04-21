import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;align-items:center;gap:6px;user-select:none">
      <div [style.padding]="size==='sm' ? '4px 8px' : '4px 10px'"
           style="background:linear-gradient(135deg,oklch(0.42 0.20 250),oklch(0.58 0.18 165));
                  border-radius:9px;display:flex;align-items:center;gap:2px;
                  box-shadow:0 2px 12px oklch(0.42 0.20 250/.35)">
        <span [style.fontSize.px]="fs" style="font-weight:800;color:white;letter-spacing:-0.03em;line-height:1">100</span>
        <div [style.width.px]="size==='sm' ? 5 : 7" [style.height.px]="size==='sm' ? 5 : 7"
             style="border-radius:50%;background:oklch(0.72 0.14 80);box-shadow:0 0 7px oklch(0.72 0.14 80/.8)"></div>
        <span [style.fontSize.px]="fs" style="font-weight:800;color:white;letter-spacing:-0.02em;line-height:1">Pro</span>
      </div>
    </div>
  `,
})
export class LogoComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  get fs() { return this.size === 'lg' ? 28 : this.size === 'sm' ? 14 : 19; }
}
