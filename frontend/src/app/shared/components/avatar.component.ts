import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    <div [style.width.px]="size" [style.height.px]="size" [style.background]="color"
         [style.fontSize.px]="size * 0.33" [style.border]="border ? '2px solid white' : 'none'"
         style="border-radius:50%;display:flex;align-items:center;justify-content:center;
                font-weight:700;color:white;flex-shrink:0;box-shadow:0 2px 6px #0002">
      {{ initials }}
    </div>
  `,
})
export class AvatarComponent {
  @Input() initials = '';
  @Input() color = 'var(--p)';
  @Input() size = 42;
  @Input() border = true;
}
