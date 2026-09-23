import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/api/auth';
  private readonly sessionKey = 'currentUser';

  constructor(private http: HttpClient) {}

  register(userData: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, userData).pipe(
      tap((user) => this.setSession(user))
    );
  }

  login(credentials: { username: string; password: string }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/login`, credentials).pipe(
      tap((user) => this.setSession(user))
    );
  }

  resetAccount(data: { username: string; email: string }): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/reset`, data).pipe(
      tap(() => {
        const current = this.getCurrentUser();
        if (current && current.username === data.username) {
          this.logout();
        }
      })
    );
  }

  setSession(user: User): void {
    const sessionData = {
      ...user,
      loginTimestamp: Date.now()
    };
    localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
  }

  getCurrentUser(): (User & { loginTimestamp: number }) | null {
    const data = localStorage.getItem(this.sessionKey);
    if (!data) return null;

    try {
      const user = JSON.parse(data);
      const sessionDuration = 60 * 60 * 1000;
      if (Date.now() - user.loginTimestamp > sessionDuration) {
        this.logout();
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
  }
}
