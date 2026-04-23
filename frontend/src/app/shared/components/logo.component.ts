import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <div style="display:flex;align-items:center;gap:8px;user-select:none;cursor:default">
      <!-- Mark: gradient rounded square with spark icon -->
      <div [style.width.px]="markSize" [style.height.px]="markSize"
           style="border-radius:28%;background:linear-gradient(135deg,oklch(0.42 0.20 250),oklch(0.52 0.20 210),oklch(0.58 0.18 165));
                  display:flex;align-items:center;justify-content:center;flex-shrink:0;
                  box-shadow:0 2px 14px oklch(0.42 0.20 250 / 0.38), 0 1px 4px oklch(0.42 0.20 250 / 0.20)">
        <svg [attr.width]="iconSize" [attr.height]="iconSize" viewBox="0 0 24 24" fill="none">
          <!-- 4-point sparkle / star -->
          <path d="M12 2 L13.5 9 L20 12 L13.5 15 L12 22 L10.5 15 L4 12 L10.5 9 Z"
                fill="white" opacity="0.95"/>
          <circle cx="19" cy="5" r="1.5" fill="white" opacity="0.7"/>
          <circle cx="6"  cy="18" r="1"   fill="white" opacity="0.5"/>
        </svg>
      </div>

      <!-- Wordmark -->
      <div style="display:flex;align-items:baseline;line-height:1">
        <span [style.font-size.px]="textSize"
              style="font-weight:800;letter-spacing:-0.04em;
                     background:linear-gradient(135deg,oklch(0.42 0.20 250),oklch(0.52 0.20 210));
                     -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">
          100
        </span>
        <span [style.font-size.px]="textSize * 0.82"
              style="font-weight:700;letter-spacing:-0.01em;
                     background:linear-gradient(135deg,oklch(0.52 0.20 210),oklch(0.58 0.18 165));
                     -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">
          pro
        </span>
      </div>
    </div>
  `,
})
export class LogoComponent {
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  get markSize() { return { sm: 26, md: 34, lg: 48, xl: 72 }[this.size]; }
  get iconSize() { return { sm: 13, md: 17, lg: 24, xl: 36 }[this.size]; }
  get textSize() { return { sm: 15, md: 20, lg: 28, xl: 42 }[this.size]; }
}
