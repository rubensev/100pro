import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { AuthResponse, User } from '../../shared/models';

const API = 'http://localhost:3000/api';
const TOKEN_KEY = '100pro_token';
const USER_KEY = '100pro_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(this.loadUser());
  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());

  constructor(private http: HttpClient) {}

  register(email: string, password: string, name: string) {
    return this.http.post<AuthResponse>(`${API}/auth/register`, { email, password, name })
      .pipe(tap(res => this.persist(res)));
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${API}/auth/login`, { email, password })
      .pipe(tap(res => this.persist(res)));
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  private persist(res: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._token.set(res.accessToken);
    this._user.set(res.user);
  }

  private loadUser(): User | null {
    const s = localStorage.getItem(USER_KEY);
    return s ? JSON.parse(s) : null;
  }
}
