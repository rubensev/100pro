import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/components/avatar.component';
import { getInitialsColor } from '../../shared/models';
import { TranslationService } from '../../i18n/translation.service';

interface Conversation {
  otherId: string;
  name: string;
  initials: string;
  lastMsg: string;
  time: string;
  hasUnread: boolean;
}

interface ThreadMsg {
  id: string;
  text: string;
  mine: boolean;
  time: string;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
  template: `
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="font-weight:800;font-size:20px">{{ i18n.t('messages.title') }}</div>

      @if (loading()) {
        <div style="text-align:center;padding:40px;color:var(--t3)">
          <div style="font-size:24px;margin-bottom:8px">⏳</div>
          <div style="font-size:13px">{{ i18n.t('messages.loading') }}</div>
        </div>
      }

      @if (!loading() && convs().length === 0) {
        <div class="card" style="padding:48px;text-align:center;color:var(--t3)">
          <div style="font-size:40px;margin-bottom:12px">💬</div>
          <div style="font-weight:600;font-size:16px">{{ i18n.t('messages.empty.title') }}</div>
          <div style="font-size:13px;margin-top:6px">{{ i18n.t('messages.empty.sub') }}</div>
        </div>
      }

      @for (c of convs(); track c.otherId; let i = $index) {
        <div class="card fu" style="padding:12px 14px;display:flex;gap:10px;cursor:pointer;transition:var(--tr)"
             [style.animation-delay]="i * 0.05 + 's'"
             (mouseenter)="$any($event.currentTarget).style.transform='translateY(-1px)'"
             (mouseleave)="$any($event.currentTarget).style.transform='none'"
             (click)="openChat(c)">
          <div style="position:relative">
            <app-avatar [initials]="c.initials" [color]="color(c.initials)" [size]="42" />
            @if (c.hasUnread) {
              <div style="position:absolute;bottom:1px;right:1px;width:10px;height:10px;border-radius:50%;background:var(--p);border:2px solid var(--ca)"></div>
            }
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;align-items:baseline">
              <span style="font-weight:700;font-size:14px">{{ c.name }}</span>
              <span style="font-size:11px;color:var(--t3)">{{ c.time }}</span>
            </div>
            <div style="font-size:12px;color:var(--t2);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ c.lastMsg }}</div>
          </div>
          @if (c.hasUnread) {
            <div style="width:8px;height:8px;border-radius:50%;background:var(--p);flex-shrink:0;align-self:center"></div>
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
            </div>
            <button (click)="activeChat.set(null)" style="font-size:22px;color:var(--t3);background:none;border:none;cursor:pointer">×</button>
          </div>
          <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px">
            @if (threadLoading()) {
              <div style="text-align:center;color:var(--t3);font-size:13px;padding:20px">{{ i18n.t('messages.loading.thread') }}</div>
            }
            @if (!threadLoading() && threadMessages().length === 0) {
              <div style="text-align:center;color:var(--t3);font-size:13px;padding:20px">{{ i18n.t('messages.start') }}</div>
            }
            @for (m of threadMessages(); track m.id) {
              <div [style.align-self]="m.mine ? 'flex-end' : 'flex-start'" style="max-width:75%">
                <div [style.background]="m.mine ? 'var(--p)' : 'var(--bg2)'" [style.color]="m.mine ? 'white' : 'var(--t)'"
                     style="border-radius:14px;padding:10px 14px;font-size:13px">{{ m.text }}</div>
                <div style="font-size:10px;color:var(--t3);margin-top:3px" [style.text-align]="m.mine ? 'right' : 'left'">{{ m.time }}</div>
              </div>
            }
          </div>
          <div style="padding:12px 14px;border-top:1px solid var(--bo);display:flex;gap:8px">
            <input [(ngModel)]="newMsg" [placeholder]="i18n.t('messages.placeholder')"
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
  i18n = inject(TranslationService);

  convs = signal<Conversation[]>([]);
  loading = signal(true);
  activeChat = signal<Conversation | null>(null);
  threadMessages = signal<ThreadMsg[]>([]);
  threadLoading = signal(false);
  newMsg = '';

  ngOnInit() { this.loadConversations(); }

  loadConversations() {
    this.loading.set(true);
    this.api.getConversations().subscribe({
      next: msgs => {
        const myId = this.auth.user()?.id;
        this.convs.set(msgs.map(m => {
          const other = m.senderId === myId ? m.receiver! : m.sender!;
          return {
            otherId: other.id,
            name: other.name,
            initials: other.avatarInitials || other.name.slice(0, 2).toUpperCase(),
            lastMsg: m.text,
            time: this.formatTime(m.createdAt),
            hasUnread: m.receiverId === myId && !m.read,
          };
        }));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  color(initials: string) { return getInitialsColor(initials); }

  openChat(c: Conversation) {
    this.activeChat.set(c);
    this.threadMessages.set([]);
    this.threadLoading.set(true);
    const myId = this.auth.user()?.id;
    this.api.getThread(c.otherId).subscribe({
      next: msgs => {
        this.threadMessages.set(msgs.map(m => ({
          id: m.id,
          text: m.text,
          mine: m.senderId === myId,
          time: this.formatTime(m.createdAt),
        })));
        this.threadLoading.set(false);
      },
      error: () => this.threadLoading.set(false),
    });
  }

  send() {
    const c = this.activeChat();
    if (!c || !this.newMsg.trim()) return;
    const text = this.newMsg;
    this.newMsg = '';
    const tempId = Date.now().toString();
    this.threadMessages.update(ms => [...ms, { id: tempId, text, mine: true, time: 'agora' }]);
    this.api.sendMessage(c.otherId, text).subscribe({
      next: () => this.loadConversations(),
      error: () => {},
    });
  }

  formatTime(createdAt: string) {
    const diff = Date.now() - new Date(createdAt).getTime();
    if (diff < 3600000) return Math.max(1, Math.floor(diff / 60000)) + 'min';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
    return Math.floor(diff / 86400000) + 'd';
  }
}
