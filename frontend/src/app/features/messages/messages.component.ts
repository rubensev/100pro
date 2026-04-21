import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/components/avatar.component';
import { getInitialsColor, Message } from '../../shared/models';

const SEED_CONVS = [
  { name: 'Carla Mendes', initials: 'CM', msg: 'Oi! Posso confirmar o horário de amanhã?', time: '2h', unread: 2, online: true },
  { name: 'Lucas Ferreira', initials: 'LF', msg: 'Entregando na sexta como combinado ✓', time: '5h', unread: 1, online: true },
  { name: 'Ana Paula Costa', initials: 'AP', msg: 'Disponível essa semana!', time: '1d', unread: 0, online: false },
  { name: 'Roberto Silva', initials: 'RS', msg: 'Obrigada pelo feedback 😊', time: '2d', unread: 0, online: false },
  { name: 'Priya Sharma', initials: 'PS', msg: 'Boa notícia: encaixe disponível!', time: '3d', unread: 0, online: false },
  { name: 'Marcos Oliveira', initials: 'MO', msg: 'Enviando o arquivo agora', time: '4d', unread: 0, online: false },
];

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
  template: `
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="font-weight:800;font-size:20px">Mensagens</div>
      @for (c of convs; track c.name; let i = $index) {
        <div class="card fu" style="padding:12px 14px;display:flex;gap:10px;cursor:pointer;transition:var(--tr)"
             [style.animation-delay]="i * 0.05 + 's'"
             (mouseenter)="$any($event.currentTarget).style.transform='translateY(-1px)'"
             (mouseleave)="$any($event.currentTarget).style.transform='none'"
             (click)="openChat(c)">
          <div style="position:relative">
            <app-avatar [initials]="c.initials" [color]="color(c.initials)" [size]="42" />
            @if (c.online) {
              <div style="position:absolute;bottom:1px;right:1px;width:10px;height:10px;border-radius:50%;background:var(--ac);border:2px solid var(--ca)"></div>
            }
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;align-items:baseline">
              <span style="font-weight:700;font-size:14px">{{ c.name }}</span>
              <span style="font-size:11px;color:var(--t3)">{{ c.time }}</span>
            </div>
            <div style="font-size:12px;color:var(--t2);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ c.msg }}</div>
          </div>
          @if (c.unread) {
            <div style="width:18px;height:18px;border-radius:50%;background:var(--p);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:white;flex-shrink:0;align-self:center">{{ c.unread }}</div>
          }
        </div>
      }
    </div>

    <!-- Chat thread modal -->
    @if (activeChat()) {
      <div class="overlay" (click)="activeChat.set(null)">
        <div class="pop card" style="width:100%;max-width:460px;height:80vh;display:flex;flex-direction:column;overflow:hidden" (click)="$event.stopPropagation()">
          <div style="padding:14px 16px;border-bottom:1px solid var(--bo);display:flex;align-items:center;gap:10px">
            <app-avatar [initials]="activeChat()!.initials" [color]="color(activeChat()!.initials)" [size]="36" />
            <div style="flex:1">
              <div style="font-weight:700;font-size:14px">{{ activeChat()!.name }}</div>
              <div style="font-size:11px;color:var(--ac)">{{ activeChat()!.online ? 'Online agora' : 'Offline' }}</div>
            </div>
            <button (click)="activeChat.set(null)" style="font-size:22px;color:var(--t3);background:none;border:none;cursor:pointer">×</button>
          </div>
          <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px">
            <div style="text-align:center;font-size:11px;color:var(--t3);margin-bottom:6px">Início da conversa</div>
            <div style="align-self:flex-start;max-width:75%">
              <div style="background:var(--bg2);border-radius:14px 14px 14px 4px;padding:10px 14px;font-size:13px">{{ activeChat()!.msg }}</div>
              <div style="font-size:10px;color:var(--t3);margin-top:3px">{{ activeChat()!.time }}</div>
            </div>
            @for (m of threadMessages(); track m) {
              <div [style.align-self]="m.mine ? 'flex-end' : 'flex-start'" style="max-width:75%">
                <div [style.background]="m.mine ? 'var(--p)' : 'var(--bg2)'" [style.color]="m.mine ? 'white' : 'var(--t)'"
                     style="border-radius:14px;padding:10px 14px;font-size:13px">{{ m.text }}</div>
              </div>
            }
          </div>
          <div style="padding:12px 14px;border-top:1px solid var(--bo);display:flex;gap:8px">
            <input [(ngModel)]="newMsg" placeholder="Digite uma mensagem..."
                   (keydown.enter)="send()"
                   style="flex:1;padding:9px 14px;border-radius:99px;border:1.5px solid var(--bo);font-size:13px;background:var(--bg);outline:none;color:var(--t)" />
            <button class="btn btn-p" style="padding:9px 16px" (click)="send()">→</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class MessagesComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);

  convs = SEED_CONVS;
  activeChat = signal<typeof SEED_CONVS[0] | null>(null);
  threadMessages = signal<{ text: string; mine: boolean }[]>([]);
  newMsg = '';

  ngOnInit() {
    this.api.getConversations().subscribe({ next: () => {}, error: () => {} });
  }

  color(initials: string) { return getInitialsColor(initials); }

  openChat(c: any) { this.activeChat.set(c); this.threadMessages.set([]); }

  send() {
    if (!this.newMsg.trim()) return;
    this.threadMessages.update(m => [...m, { text: this.newMsg, mine: true }]);
    this.newMsg = '';
  }
}
