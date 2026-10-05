import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/api/auth';
  private readonly userKey = 'currentUser';

  constructor(private http: HttpClient) {}

  login(username: string, password?: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap((user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.userKey, JSON.stringify(user));
        }
      })
    );
  }

  register(userData: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.userKey);
    }
  }

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }
}
