import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../domain/model/user';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/users';
  private currentUser: User | null = null;

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}?email=${email}&password=${password}`);
  }

  register(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  checkEmailExists(email: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}?email=${email}`);
  }

  setCurrentUser(user: User): void {
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  getCurrentUser(): User | null {
    if (!this.currentUser) {
      const stored = localStorage.getItem('currentUser');
      this.currentUser = stored ? JSON.parse(stored) : null;
    }
    return this.currentUser;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }
}