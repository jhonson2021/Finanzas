// planes.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlanPago } from '../domain/model/planPago';

@Injectable({
  providedIn: 'root'
})
export class PlanesService {
  private apiUrl = 'http://localhost:3000/planes';

  constructor(private http: HttpClient) {}

  // Obtener todos los planes
  getPlanes(): Observable<PlanPago[]> {
    return this.http.get<PlanPago[]>(this.apiUrl);
  }

  // Obtener planes por usuario
  getPlanesByUsuario(usuarioId: number): Observable<PlanPago[]> {
    return this.http.get<PlanPago[]>(`${this.apiUrl}?usuarioId=${usuarioId}`);
  }

  // Obtener un plan por ID
  getPlan(id: number): Observable<PlanPago> {
    return this.http.get<PlanPago>(`${this.apiUrl}/${id}`);
  }

  // Crear un nuevo plan
  crearPlan(plan: PlanPago): Observable<PlanPago> {
    return this.http.post<PlanPago>(this.apiUrl, plan);
  }

  // Actualizar un plan existente
  actualizarPlan(id: number, plan: PlanPago): Observable<PlanPago> {
    return this.http.put<PlanPago>(`${this.apiUrl}/${id}`, plan);
  }

  // Eliminar un plan
  eliminarPlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Obtener planes por local
  getPlanesByLocal(localId: number): Observable<PlanPago[]> {
    return this.http.get<PlanPago[]>(`${this.apiUrl}?localId=${localId}`);
  }

  // Obtener planes por banco
  getPlanesByBanco(bancoId: number): Observable<PlanPago[]> {
    return this.http.get<PlanPago[]>(`${this.apiUrl}?bancoId=${bancoId}`);
  }
}