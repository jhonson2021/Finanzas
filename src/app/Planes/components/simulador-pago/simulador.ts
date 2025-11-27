import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocalesService } from '../../../Locales/domain/services/locales.service';
import { BancosService } from '../../../Bancos/services/bancos.service';
import { CalculadoraFinancieraService } from '../../services/calculadoraFinancieraService';
import { AuthService } from '../../../Log-In/services/authService';
import { PlanesService } from '../../services/planesService';
import { Local } from '../../../Locales/domain/model/local';
import { Banco } from '../../../Bancos/domain/model/banco';
import { User } from '../../../Log-In/domain/model/user';
import { ConfiguracionPlan } from '../../domain/model/configurationPlan';
import { PlanPago } from '../../domain/model/planPago';
import { Cuota } from '../../domain/model/cuota';
import { IndicadoresFinancieros } from '../../domain/model/indicadoresFinancieros';

@Component({
  selector: 'app-simulador',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './simulador.html',
  styleUrls: ['./simulador.css']
})
export class SimuladorComponent implements OnInit {
  simuladorForm: FormGroup;
  local: Local | null = null;
  banco: Banco | null = null;
  currentUser: User | null = null;
  loading: boolean = true;
  generandoPlan: boolean = false;
  guardandoPlan: boolean = false;

  // Resultados
  planGenerado: PlanPago | null = null;
  cuotas: Cuota[] = [];
  indicadores: IndicadoresFinancieros | null = null;

  // Opciones
  monedas = ['PEN', 'USD'];
  tiposTasa = ['EFECTIVA', 'NOMINAL'];
  capitalizaciones = ['MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'];
  tiposGracia = ['NINGUNO', 'TOTAL', 'PARCIAL'];
  frecuenciasPago = [
    { valor: 12, label: 'Mensual (12 veces/año)' },
    { valor: 6, label: 'Bimestral (6 veces/año)' },
    { valor: 4, label: 'Trimestral (4 veces/año)' },
    { valor: 2, label: 'Semestral (2 veces/año)' },
    { valor: 1, label: 'Anual (1 vez/año)' }
  ];

  fechaInicioISO: string = new Date().toISOString().slice(0, 10);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private localesService: LocalesService,
    private bancosService: BancosService,
    private calculadoraService: CalculadoraFinancieraService,
    private authService: AuthService,
    private planesService: PlanesService,
    private cd: ChangeDetectorRef
  ) {
    this.simuladorForm = this.crearFormulario();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    const localId = Number(this.route.snapshot.queryParamMap.get('localId'));
    const bancoId = Number(this.route.snapshot.queryParamMap.get('bancoId'));

    if (!localId || !bancoId) {
      alert('Datos incompletos. Regresando a locales...');
      this.router.navigate(['/locales']);
      return;
    }

    this.cargarDatos(localId, bancoId);
  }

  crearFormulario(): FormGroup {
    return this.fb.group({
      porcentajeCuotaInicial: [20, [Validators.required, Validators.min(10), Validators.max(50)]],
      cuotaInicial: [0, [Validators.required, Validators.min(0)]],
      plazoAnios: [20, [Validators.required, Validators.min(1), Validators.max(30)]],
      moneda: ['PEN', Validators.required],
      tipoTasa: ['EFECTIVA', Validators.required],
      tasaInteresPct: [8.5, [Validators.required, Validators.min(0)]],
      capitalizacion: ['MENSUAL'],
      frecuenciaPago: [12, Validators.required],
      tipoGracia: ['NINGUNO', Validators.required],
      periodoGracia: [0, [Validators.min(0), Validators.max(60)]],
      tasaDescuentoPct: [8, [Validators.required, Validators.min(0)]], // Cambiado de 10 a 8
    });
  }

  cargarDatos(localId: number, bancoId: number): void {
    this.localesService.getLocal(localId).subscribe({
      next: (local) => {
        this.local = local;
        this.calcularCuotaInicial();
        this.cargarBanco(bancoId);
      },
      error: (error) => {
        console.error('Error al cargar local:', error);
        this.loading = false;
      }
    });
  }

  cargarBanco(bancoId: number): void {
    this.bancosService.getBanco(bancoId).subscribe({
      next: (banco) => {
        this.banco = banco;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar banco:', error);
        this.loading = false;
      }
    });
  }

  calcularCuotaInicial(): void {
    if (!this.local) return;
    const porcentaje = this.simuladorForm.get('porcentajeCuotaInicial')?.value || 20;
    const cuotaInicial = (this.local.precio * porcentaje) / 100;
    this.simuladorForm.patchValue({ cuotaInicial }, { emitEvent: false });
  }

  onPorcentajeChange(): void {
    this.calcularCuotaInicial();
  }

  onCuotaInicialChange(): void {
    if (!this.local) return;
    const cuotaInicial = this.simuladorForm.get('cuotaInicial')?.value || 0;
    const porcentaje = (cuotaInicial / this.local.precio) * 100;
    this.simuladorForm.patchValue({ porcentajeCuotaInicial: Number(porcentaje.toFixed(2)) }, { emitEvent: false });
  }

  get montoPrestamo(): number {
    if (!this.local) return 0;
    const cuotaInicial = this.simuladorForm.get('cuotaInicial')?.value || 0;
    return Math.max(0, this.local.precio - cuotaInicial);
  }

  get costosInicialesTotal(): number {
    if (!this.banco) return 0;
    const costos = this.banco.costosIniciales || {};
    const montoPrestamo = this.montoPrestamo;
    const comisionActivacionRaw = costos.porcentajeComisionActivacion ?? 0;
    const seguroDesgravRaw = costos.porcentajeSeguroDesgravamen ?? 0;
    const comisionActivacion = comisionActivacionRaw > 1 ? comisionActivacionRaw / 100 : comisionActivacionRaw;
    const seguroDesgrav = seguroDesgravRaw > 1 ? seguroDesgravRaw / 100 : seguroDesgravRaw;

    return (
      (costos.costesNotariales || 0) +
      (costos.seguroRiesgo || 0) +
      (costos.costesRegistrales || 0) +
      (costos.tasacion || 0) +
      (costos.comisionEstudio || 0) +
      (montoPrestamo * (comisionActivacion || 0)) +
      (montoPrestamo * (seguroDesgrav || 0))
    );
  }

  mostrarCapitalizacion(): boolean {
    return this.simuladorForm.get('tipoTasa')?.value === 'NOMINAL';
  }

  calcularTotalInteres(): number {
    if (!this.cuotas || this.cuotas.length === 0) return 0;
    return this.cuotas.reduce((total, cuota) => total + (cuota.interes || 0), 0);
  }

  calcularTotalCuotas(): number {
    if (!this.cuotas || this.cuotas.length === 0) return 0;
    return this.cuotas.reduce((total, c) =>
      total + (
        (c.cuota || 0) +
        (c.seguroDesgravamen || 0) +
        (c.seguroRiesgo || 0) +
        (c.comision || 0) +
        (c.portes || 0) +
        (c.gastosAdministracion || 0) +
        (c.prepago || 0)
      )
    , 0);
  }

  calcularTotalPagado(): number {
    if (!this.cuotas || this.cuotas.length === 0) return 0;
    return this.cuotas.reduce((total, cuota) => total + (-(cuota.flujo || 0)), 0);
  }

  generarPlan(): void {
    if (this.simuladorForm.invalid || !this.local || !this.banco || !this.currentUser) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }

    this.generandoPlan = true;

    const formData = this.simuladorForm.value;
    const frecuenciaPago: number = formData.frecuenciaPago || 12;
    const numAnios: number = formData.plazoAnios;
    
    // Convertir tasas de % a decimal
    const tasaInteresDecimal = (formData.tasaInteresPct || 0) / 100;
    const tasaDescuentoDecimal = (formData.tasaDescuentoPct || 0) / 100;

    const config: ConfiguracionPlan = {
      moneda: formData.moneda,
      tipoTasa: formData.tipoTasa,
      capitalizacion: formData.capitalizacion,
      periodoGracia: formData.periodoGracia || 0,
      tipoGracia: formData.tipoGracia || 'NINGUNO',
      tasaInteres: tasaInteresDecimal,
      tasaDescuento: tasaDescuentoDecimal
    };

    try {
      const resultado = this.calculadoraService.generarPlanPagos(
        this.montoPrestamo,
        numAnios,
        this.banco,
        config,
        0,
        frecuenciaPago
      );

      this.cuotas = this.asignarFechasACuotas(resultado.cuotas, frecuenciaPago, this.fechaInicioISO);

      const indicadores = this.calculadoraService.calcularIndicadores(
        this.montoPrestamo,
        this.cuotas,
        resultado.costosInicialesTotal,
        config,
        frecuenciaPago
      );

      this.planGenerado = {
        usuarioId: this.currentUser.id!,
        localId: this.local.id,
        bancoId: this.banco.id,
        configuracion: config,
        precioVenta: this.local.precio,
        cuotaInicial: formData.cuotaInicial,
        montoPrestamo: this.montoPrestamo,
        numAnios: numAnios,
        cuotasPorAnio: frecuenciaPago,
        frecuenciaPago: this.frecuenciasPago.find(f => f.valor === frecuenciaPago)?.label || String(frecuenciaPago),
        totalCuotas: this.cuotas.length,
        diasPorAnio: 360,
        cuotaFija: resultado.cuotaFija,
        totalInteres: resultado.totalInteres,
        costosInicialesTotal: resultado.costosInicialesTotal,
        costosPeriodicos: this.banco.costosPeriodicos,
        indicadores: indicadores,
        cuotas: this.cuotas,
        createdAt: new Date().toISOString()
      };

      this.indicadores = indicadores;
      this.generandoPlan = false;
      this.cd.detectChanges();

      console.log('Plan generado:', this.planGenerado);
      console.log('Indicadores:', this.indicadores);
    } catch (err) {
      console.error('Error generando plan:', err);
      alert('Error al generar plan. Revisa consola.');
      this.generandoPlan = false;
    }
  }

  private asignarFechasACuotas(cuotas: Cuota[], frecuenciaPago: number, fechaInicioISO: string): Cuota[] {
    const mesesPorPeriodo = 12 / frecuenciaPago;
    const start = new Date(fechaInicioISO);
    return cuotas.map((c, idx) => {
      const monthsToAdd = Math.round((idx) * mesesPorPeriodo);
      const d = new Date(start.getFullYear(), start.getMonth() + monthsToAdd, start.getDate());
      const fechaPagoIso = d.toISOString().slice(0, 10);
      return { ...c, fechaPago: fechaPagoIso };
    });
  }

  guardarPlan(): void {
    if (!this.planGenerado) {
      alert('Genera primero el plan antes de guardar.');
      return;
    }

    if (this.guardandoPlan) {
      return; 
    }

    this.guardandoPlan = true;

    const planParaGuardar = { ...this.planGenerado };
    delete (planParaGuardar as any).id;

    this.planesService.crearPlan(planParaGuardar).subscribe({
      next: (planGuardado) => {
        this.guardandoPlan = false;
        console.log('Plan guardado exitosamente:', planGuardado);
        
        this.planGenerado = planGuardado;
        
        const irAPlanes = confirm(
          `¡Plan guardado exitosamente! ID: ${planGuardado.id}\n\n` +
          '¿Deseas ver todos tus planes guardados?'
        );
        
        if (irAPlanes) {
          this.router.navigate(['/planes']);
        }
      },
      error: (error) => {
        this.guardandoPlan = false;
        console.error('Error al guardar el plan:', error);
        alert('Error al guardar el plan. Por favor, intenta nuevamente.');
      }
    });
  }

  volver(): void {
    this.router.navigate(['/local-detalle', this.local?.id]);
  }
}