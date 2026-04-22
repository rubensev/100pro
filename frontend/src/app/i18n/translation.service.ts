import { Injectable, signal, computed } from '@angular/core';
import { T, Lang } from './translations';

const STORAGE_KEY = '100pro_lang';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  lang = signal<Lang>((localStorage.getItem(STORAGE_KEY) as Lang) || 'en');

  setLang(l: Lang) {
    this.lang.set(l);
    localStorage.setItem(STORAGE_KEY, l);
  }

  t(key: string, params: Record<string, string> = {}): string {
    const l = this.lang();
    const template = T[key]?.[l] ?? T[key]?.['en'] ?? key;
    return template.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? '');
  }

  get locale(): string {
    switch (this.lang()) {
      case 'pt': return 'pt-BR';
      case 'fr': return 'fr-FR';
      default:   return 'en-US';
    }
  }
}
