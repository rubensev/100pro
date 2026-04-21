import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stars',
  standalone: true,
  template: `
    <span [style.color]="'var(--go)'" [style.fontSize.px]="size" style="letter-spacing:1px">
      {{ '★'.repeat(filled) }}{{ '☆'.repeat(5 - filled) }}
    </span>
  `,
})
export class StarsComponent {
  @Input() rating = 5;
  @Input() size = 12;
  get filled() { return Math.round(this.rating); }
}
