import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Banco } from '../domain/model/banco';

@Injectable({
  providedIn: 'root'
})
export class BancosService {
  private apiUrl = 'http://localhost:3000/bancos';

  constructor(private http: HttpClient) {}

  getBancos(): Observable<Banco[]> {
    return this.http.get<Banco[]>(this.apiUrl);
  }

  getBanco(id: number): Observable<Banco> {
    return this.http.get<Banco>(`${this.apiUrl}/${id}`);
  }
}