import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LocalesService } from '../../domain/services/locales.service';
import { BancosService } from '../../../Bancos/services/bancos.service';
import { AuthService } from '../../../Log-In/services/authService';
import { Local } from '../../domain/model/local';
import { Banco } from '../../../Bancos/domain/model/banco';
import { User } from '../../../Log-In/domain/model/user';

@Component({
  selector: 'app-local-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './local-detalle.html',
  styleUrls: ['./local-detalle.css']
})
export class LocalDetalleComponent implements OnInit {
  local: Local | null = null;
  bancos: Banco[] = [];
  bancoSeleccionado: Banco | null = null;
  currentUser: User | null = null;
  loading: boolean = true;
  cumpleSueldoMinimo: boolean = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private localesService: LocalesService,
    private bancosService: BancosService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    const localId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarLocal(localId);
    this.cargarBancos();
  }

  cargarLocal(id: number): void {
    this.localesService.getLocal(id).subscribe({
      next: (data) => {
        this.local = data;
        this.verificarSueldoMinimo();
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar local:', error);
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  cargarBancos(): void {
    this.bancosService.getBancos().subscribe({
      next: (data) => {
        this.bancos = data;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar bancos:', error);
      }
    });
  }

  verificarSueldoMinimo(): void {
    if (this.local && this.currentUser) {
      const ingresoUsuario = this.currentUser.financialInfo.ingresoMensual;
      this.cumpleSueldoMinimo = ingresoUsuario >= this.local.sueldoMinimo;
    }
  }

  seleccionarBanco(banco: Banco): void {
    this.bancoSeleccionado = banco;
    this.cd.detectChanges();
  }

  irASimulador(): void {
    if (!this.cumpleSueldoMinimo) {
      alert(`❌ Tu ingreso mensual (S/ ${this.currentUser?.financialInfo.ingresoMensual}) no cumple con el sueldo mínimo requerido (S/ ${this.local?.sueldoMinimo}).`);
      return;
    }

    if (!this.local || !this.bancoSeleccionado) {
      alert('⚠️ Por favor selecciona un banco para continuar.');
      return;
    }

    // Navegar al simulador con los IDs
    this.router.navigate(['/simulador'], {
      queryParams: {
        localId: this.local.id,
        bancoId: this.bancoSeleccionado.id
      }
    });
  }

  volver(): void {
    this.router.navigate(['/locales']);
  }
}