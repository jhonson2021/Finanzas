import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PlanesService } from '../services/planesService';
import { LocalesService } from '../../Locales/domain/services/locales.service';
import { BancosService } from '../../Bancos/services/bancos.service';
import { Local } from '../../Locales/domain/model/local';
import { Banco } from '../../Bancos/domain/model/banco';
import { AuthService } from '../../Log-In/services/authService';
import { PlanPago } from '../domain/model/planPago';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

interface PlanConDetalles extends PlanPago {
  local?: Local;
  banco?: Banco;
}

@Component({
  selector: 'app-planes-lista',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './planes-lista.component.html',
  styleUrls: ['./planes-lista.component.css']
})
export class PlanesListaComponent implements OnInit {
  planes: PlanConDetalles[] = [];
  planesOriginales: PlanConDetalles[] = [];
  loading: boolean = true;
  error: string = '';
  currentUserId: number | null = null;

  // Filtros
  filtroMoneda: string = 'TODOS';
  filtroOrden: string = 'reciente';
  busqueda: string = '';

  constructor(
    private planesService: PlanesService,
    private localesService: LocalesService,
    private bancosService: BancosService,
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUserId = currentUser.id;
    this.cargarPlanes();
  }

  cargarPlanes(): void {
    this.loading = true;
    this.error = '';

    this.planesService.getPlanesByUsuario(this.currentUserId!).subscribe({
      next: (planes) => {
        if (planes.length === 0) {
          this.cd.detectChanges();
          this.planes = [];
          this.planesOriginales = [];
          this.loading = false;
          return;
        }

        // Cargar detalles de locales y bancos
        const localIds = [...new Set(planes.map(p => p.localId))];
        const bancoIds = [...new Set(planes.map(p => p.bancoId))];

        const localesObservables = localIds.map(id => this.localesService.getLocal(id));
        const bancosObservables = bancoIds.map(id => this.bancosService.getBanco(id));

        forkJoin([
          forkJoin(localesObservables.length > 0 ? localesObservables : []),
          forkJoin(bancosObservables.length > 0 ? bancosObservables : [])
        ]).subscribe({
          next: ([locales, bancos]) => {
            this.planes = planes.map(plan => ({
              ...plan,
              local: locales.find((l: Local) => l.id === plan.localId),
              banco: bancos.find((b: Banco) => b.id === plan.bancoId)
            }));
            this.planesOriginales = [...this.planes];
            this.aplicarFiltros();
            this.loading = false;
            this.cd.detectChanges();
          },
          error: (error) => {
            console.error('Error cargando detalles:', error);
            this.planes = planes;
            this.planesOriginales = [...this.planes];
            this.loading = false;
            this.cd.detectChanges();
          }
        });
      },
      error: (error) => {
        console.error('Error cargando planes:', error);
        this.error = 'Error al cargar los planes. Por favor, intenta nuevamente.';
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  aplicarFiltros(): void {
    let planesFiltrados = [...this.planesOriginales];

    // Filtro por moneda
    if (this.filtroMoneda !== 'TODOS') {
      planesFiltrados = planesFiltrados.filter(p => 
        p.configuracion.moneda === this.filtroMoneda
      );
    }

    // Filtro por búsqueda
    if (this.busqueda.trim()) {
      const busquedaLower = this.busqueda.toLowerCase();
      planesFiltrados = planesFiltrados.filter(p => 
        p.local?.nombre.toLowerCase().includes(busquedaLower) ||
        p.banco?.nombre.toLowerCase().includes(busquedaLower) ||
        p.banco?.sigla.toLowerCase().includes(busquedaLower)
      );
    }

    // Ordenar
    switch(this.filtroOrden) {
      case 'reciente':
        planesFiltrados.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'antiguo':
        planesFiltrados.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case 'cuota-menor':
        planesFiltrados.sort((a, b) => a.cuotaFija - b.cuotaFija);
        break;
      case 'cuota-mayor':
        planesFiltrados.sort((a, b) => b.cuotaFija - a.cuotaFija);
        break;
      case 'monto-menor':
        planesFiltrados.sort((a, b) => a.montoPrestamo - b.montoPrestamo);
        break;
      case 'monto-mayor':
        planesFiltrados.sort((a, b) => b.montoPrestamo - a.montoPrestamo);
        break;
    }

    this.planes = planesFiltrados;
  }

  onFiltroChange(): void {
    this.aplicarFiltros();
  }

  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  verDetalle(planId: number): void {
    this.router.navigate(['/plan-detalle', planId]);
  }

  eliminarPlan(plan: PlanConDetalles, event: Event): void {
    event.stopPropagation();
    
    const confirmar = confirm(
      `¿Estás seguro de eliminar este plan?\n\n` +
      `Propiedad: ${plan.local?.nombre || 'N/A'}\n` +
      `Banco: ${plan.banco?.sigla || 'N/A'}\n` +
      `Cuota: S/ ${plan.cuotaFija.toLocaleString()}`
    );

    if (confirmar && plan.id) {
      this.planesService.eliminarPlan(plan.id).subscribe({
        next: () => {
          this.planes = this.planes.filter(p => p.id !== plan.id);
          this.planesOriginales = this.planesOriginales.filter(p => p.id !== plan.id);
          alert('Plan eliminado exitosamente');
        },
        error: (error) => {
          console.error('Error al eliminar plan:', error);
          alert('Error al eliminar el plan');
        }
      });
    }
  }

  compararPlanes(): void {
    // Seleccionar planes para comparar
    const planesSeleccionados = this.planes.filter(p => (p as any).seleccionado);
    if (planesSeleccionados.length < 2) {
      alert('Selecciona al menos 2 planes para comparar');
      return;
    }
    if (planesSeleccionados.length > 4) {
      alert('Puedes comparar hasta 4 planes a la vez');
      return;
    }
    
    const ids = planesSeleccionados.map(p => p.id).join(',');
    this.router.navigate(['/comparar-planes'], { queryParams: { ids } });
  }

  toggleSeleccion(plan: PlanConDetalles, event: Event): void {
    event.stopPropagation();
    (plan as any).seleccionado = !(plan as any).seleccionado;
  }

  get planesSeleccionados(): number {
    return this.planes.filter(p => (p as any).seleccionado).length;
  }

  crearNuevoPlan(): void {
    this.router.navigate(['/locales']);
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calcularTotalPagado(plan: PlanPago): number {
    return plan.cuotaFija * plan.totalCuotas + plan.costosInicialesTotal;
  }
}