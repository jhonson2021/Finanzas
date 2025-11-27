import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Local } from '../model/local';


@Injectable({
  providedIn: 'root'
})
export class LocalesService {
  private apiUrl = 'http://localhost:3000/locales';

  constructor(private http: HttpClient) {}

  getLocales(): Observable<Local[]> {
    return this.http.get<Local[]>(this.apiUrl);
  }

  getLocal(id: number): Observable<Local> {
    return this.http.get<Local>(`${this.apiUrl}/${id}`);
  }
}