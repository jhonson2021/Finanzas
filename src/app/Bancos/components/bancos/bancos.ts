import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BancosService } from '../../services/bancos.service';
import { Banco } from '../../domain/model/banco';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-bancos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bancos.html',
  styleUrls: ['./bancos.css'],
})
export class Bancos implements OnInit {
  bancos: Banco[] = [];
  loading = false;
  error: string | null = null;

  private bancosService = inject(BancosService);

  // UI state
  montoSimulado: number = 200000; // monto de ejemplo para calcular porcentajes
  expandedBancoId: number | null = null;

  constructor(
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadBancos();
  }

  loadBancos(): void {
    this.loading = true;
    this.error = null;
    this.bancosService.getBancos().subscribe({
      next: (data) => {
        this.bancos = data || [];
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error loading bancos', err);
        this.error = 'No se pudo cargar la lista de bancos.';
        this.loading = false;
      }
    });
  }

  toggleExpand(bancoId: number): void {
    this.expandedBancoId = this.expandedBancoId === bancoId ? null : bancoId;
  }

  calcularCostosIniciales(banco: Banco) {
    const ci = banco.costosIniciales;
    if (!ci) return null;

    const fijos = (ci.costesNotariales || 0)
      + (ci.seguroRiesgo || 0)
      + (ci.costesRegistrales || 0)
      + (ci.tasacion || 0)
      + (ci.comisionEstudio || 0)
      + (ci.seguroDesgravamenInicial || 0);

    
    const seguroDesgravamen = (this.montoSimulado || 0) * ((ci.porcentajeSeguroDesgravamen || 0) / 100);

    const total = fijos  + seguroDesgravamen;

    return {
      fijos,
      seguroDesgravamen,
      total,
    };
  }

  

  verDetalle(banco: Banco): void {
    // Mantener por compatibilidad: también permite alternar la vista
    this.toggleExpand(banco.id);
  }

}


