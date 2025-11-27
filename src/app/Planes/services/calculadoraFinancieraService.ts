import { Injectable } from '@angular/core';
import { Cuota } from '../domain/model/cuota';
import { IndicadoresFinancieros } from '../domain/model/indicadoresFinancieros';
import { ConfiguracionPlan } from '../domain/model/configurationPlan';
import { Banco } from '../../Bancos/domain/model/banco';

@Injectable({
  providedIn: 'root'
})
export class CalculadoraFinancieraService {

  constructor() {}

  private mesesPorPeriodo(frecuenciaPago: number): number {
    return 12 / frecuenciaPago;
  }

  // TEA (Tasa Efectiva Anual en decimal) a TEM (Tasa Efectiva Mensual en decimal)
  convertirTEAaMensual(tea: number): number {
    return Math.pow(1 + tea, 1 / 12) - 1;
  }

  // TNA (Tasa Nominal Anual en decimal) a TEM (Tasa Efectiva Mensual en decimal)
  convertirNominalAMensual(tna: number, capitalizacion: string): number {
    const map: any = { 'MENSUAL': 12, 'BIMESTRAL': 6, 'TRIMESTRAL': 4, 'SEMESTRAL': 2, 'ANUAL': 1 };
    const mcap = map[capitalizacion] || 12;
    const iEffAnual = Math.pow(1 + tna / mcap, mcap) - 1;
    return Math.pow(1 + iEffAnual, 1 / 12) - 1;
  }

  calcularTasaMensualDesdeConfig(config: ConfiguracionPlan): number {
    if (config.tipoTasa === 'EFECTIVA') {
      return this.convertirTEAaMensual(config.tasaInteres);
    } else {
      return this.convertirNominalAMensual(config.tasaInteres, config.capitalizacion || 'MENSUAL');
    }
  }

  // TEM (decimal) a Tasa por Periodo (decimal)
  calcularTasaPorPeriodoDesdeTEM(temMensual: number, frecuenciaPago: number): number {
    const m = this.mesesPorPeriodo(frecuenciaPago);
    return Math.pow(1 + temMensual, m) - 1;
  }

  calcularCuotaFijaSistemaFrances(
    montoPrestamo: number,
    tasaPeriodo: number,
    numCuotas: number,
    periodoGracia: number,
    tipoGracia: 'NINGUNO' | 'TOTAL' | 'PARCIAL'
  ): number {
    const cuotasReales = tipoGracia === 'TOTAL' ? numCuotas - periodoGracia : numCuotas;
    if (cuotasReales <= 0) return 0;
    
    let PVajustado = montoPrestamo;
    if (tipoGracia === 'TOTAL' && periodoGracia > 0) {
      PVajustado = montoPrestamo * Math.pow(1 + tasaPeriodo, periodoGracia);
    }
    if (tasaPeriodo === 0) return PVajustado / cuotasReales;
    const factor = Math.pow(1 + tasaPeriodo, cuotasReales);
    return PVajustado * (tasaPeriodo * factor) / (factor - 1);
  }

  generarPlanPagos(
    montoPrestamo: number,
    numAnios: number,
    banco: Banco,
    config: ConfiguracionPlan,
    bonoAplicable: number = 0,
    frecuenciaPago: number = 12
  ): {
    cuotas: Cuota[],
    cuotaFija: number,
    totalInteres: number,
    flujos: number[],
    costosInicialesTotal: number
  } {

    const temMensual = this.calcularTasaMensualDesdeConfig(config); 
    const tasaPeriodo = this.calcularTasaPorPeriodoDesdeTEM(temMensual, frecuenciaPago); 
    const mesesPeriodo = this.mesesPorPeriodo(frecuenciaPago);

    const numCuotas = numAnios * frecuenciaPago;
    const periodoGracia = config.periodoGracia || 0;
    const tipoGracia = config.tipoGracia || 'NINGUNO';

    // 1) CÁLCULO DE COSTOS INICIALES
    const ci = banco.costosIniciales || {};
    const porcentajeComisionActivacion = ci.porcentajeComisionActivacion || 0; 
    const porcentajeSeguroDesgravamen = ci.porcentajeSeguroDesgravamen || 0;
    
    const costosInicialesTotal =
      (ci.costesNotariales || 0) +
      (ci.seguroRiesgo || 0) +
      (ci.costesRegistrales || 0) +
      (ci.tasacion || 0) +
      (ci.comisionEstudio || 0) +
      (montoPrestamo * porcentajeComisionActivacion) +
      (montoPrestamo * porcentajeSeguroDesgravamen);

    // 2) Monto efectivo a financiar
    const montoPrestamoConBono = Math.max(0, montoPrestamo - (bonoAplicable || 0));

    // 3) Cuota fija (sistema francés)
    const cuotaFija = this.calcularCuotaFijaSistemaFrances(
      montoPrestamoConBono,
      tasaPeriodo,
      numCuotas,
      periodoGracia,
      tipoGracia as any
    );

    // 4) COSTOS PERIÓDICOS
    const cp = banco.costosPeriodicos || {};
    const porcentajeSeguroRiesgoAnual = cp.porcentajeSeguroContraTodoRiesgo || 0; 
    const comisionPeriodica = cp.comisionPeriodica || 0;
    const portes = cp.portes || 0;
    const gastosAdministracion = cp.gastosAdministracion || 0;
    const mantenimientoCuenta = cp.mantenimientoCuenta || 0;

    const cuotas: Cuota[] = [];
    let saldo = montoPrestamoConBono;
    let totalInteres = 0;

    const flujos: number[] = [];
    // Flujo inicial: dinero que RECIBE el cliente (positivo)
    flujos.push(montoPrestamoConBono - costosInicialesTotal);

    for (let i = 1; i <= numCuotas; i++) {
      const interes = saldo * tasaPeriodo;

      let amortizacion = 0;
      let pagoPeriodo = 0;
      let prepago = 0;

      if (i <= periodoGracia) {
        if (tipoGracia === 'TOTAL') {
          amortizacion = 0;
          pagoPeriodo = 0;
          saldo = saldo + interes; 
        } else if (tipoGracia === 'PARCIAL') {
          amortizacion = 0;
          pagoPeriodo = interes;
        } else {
          pagoPeriodo = cuotaFija;
          amortizacion = pagoPeriodo - interes;
          saldo = saldo - amortizacion;
        }
      } else {
        pagoPeriodo = cuotaFija;
        amortizacion = pagoPeriodo - interes;
        saldo = saldo - amortizacion;
      }

      const seguroDesgravamen = saldo * porcentajeSeguroDesgravamen * mesesPeriodo;
      const seguroRiesgo = (montoPrestamoConBono * porcentajeSeguroRiesgoAnual) * mesesPeriodo;
      const otrosCostos = (portes || 0) + (gastosAdministracion || 0) + (mantenimientoCuenta || 0) + (comisionPeriodica || 0);

      // Flujo de caja: Egreso es negativo
      const flujoPeriodo = -(
        (pagoPeriodo || 0) +
        (seguroDesgravamen || 0) +
        (seguroRiesgo || 0) +
        (otrosCostos || 0) +
        (prepago || 0)
      );

      const cuotaObj: Cuota = {
        numero: i,
        fechaPago: '', 
        saldoInicial: Number((saldo + amortizacion).toFixed(2)),
        saldoInicialIndexado: Number((saldo + amortizacion).toFixed(2)),
        interes: Number(interes.toFixed(2)),
        amortizacion: Number(amortizacion.toFixed(2)),
        cuota: Number((pagoPeriodo || 0).toFixed(2)),
        prepago: Number((prepago || 0).toFixed(2)),
        seguroDesgravamen: Number(seguroDesgravamen.toFixed(2)),
        seguroRiesgo: Number(seguroRiesgo.toFixed(2)),
        comision: Number((comisionPeriodica || 0).toFixed(2)),
        portes: Number((portes || 0).toFixed(2)),
        gastosAdministracion: Number(((gastosAdministracion || 0) + (mantenimientoCuenta || 0)).toFixed(2)),
        saldoFinal: Number(saldo.toFixed(2)),
        flujo: Number(flujoPeriodo.toFixed(2))
      };

      cuotas.push(cuotaObj);
      totalInteres += interes;
      flujos.push(flujoPeriodo);
    }

    return {
      cuotas,
      cuotaFija: Number(cuotaFija.toFixed(2)),
      totalInteres: Number(totalInteres.toFixed(2)),
      flujos,
      costosInicialesTotal: Number(costosInicialesTotal.toFixed(2))
    };
  }

  // ---------- VAN / TIR / TCEA / Duracion / Convexidad ----------
  
  calcularVAN(flujos: number[], tasaDescuentoAnualDecimal: number, frecuenciaPago: number): number {
    const tdPeriod = Math.pow(1 + tasaDescuentoAnualDecimal, 1 / frecuenciaPago) - 1;
    let van = 0;
    for (let i = 0; i < flujos.length; i++) {
      van += flujos[i] / Math.pow(1 + tdPeriod, i);
    }
    return Number(van.toFixed(2));
  }

  // IRR robusta por bisección -> retorna tasa por periodo en decimal
  calcularTIRDecimal(flujos: number[], low = -0.99, high = 5, tol = 1e-7, maxIter = 300): number | null {
    const npv = (r: number) => {
      let suma = 0;
      for (let i = 0; i < flujos.length; i++) {
        suma += flujos[i] / Math.pow(1 + r, i);
      }
      return suma;
    };

    let fLow = npv(low);
    let fHigh = npv(high);
    
    if (isNaN(fLow) || isNaN(fHigh) || !isFinite(fLow) || !isFinite(fHigh)) {
      return null;
    }
    
    // Si ambos tienen el mismo signo, no hay cambio de signo = no hay raíz
    if (fLow * fHigh > 0) {
      // Intentar expandir el rango
      low = -0.99;
      high = 10;
      fLow = npv(low);
      fHigh = npv(high);
      if (fLow * fHigh > 0) {
        return null;
      }
    }
    
    let mid = 0;
    for (let i = 0; i < maxIter; i++) {
      mid = (low + high) / 2;
      const fMid = npv(mid);
      
      if (!isFinite(fMid)) return null;
      if (Math.abs(fMid) < tol) return mid;
      
      if (fLow * fMid <= 0) {
        high = mid;
        fHigh = fMid;
      } else {
        low = mid;
        fLow = fMid;
      }
    }
    return mid;
  }

  // Retorna TIR anualizada en porcentaje (%)
  calcularTIR(flujos: number[], frecuenciaPago: number): number | null {
    const tirPeriodDecimal = this.calcularTIRDecimal(flujos);
    if (tirPeriodDecimal === null) return null;
    const tirAnual = Math.pow(1 + tirPeriodDecimal, frecuenciaPago) - 1;
    return Number((tirAnual * 100).toFixed(4));
  }

  // Retorna TCEA anualizada en porcentaje (%)
  calcularTCEA(montoPrestamo: number, cuotas: Cuota[], costosIniciales: number, frecuenciaPago: number): number | null {
    const flujos: number[] = [montoPrestamo - costosIniciales];
    cuotas.forEach(c => {
      const pagoTotal = (c.cuota || 0) + (c.seguroDesgravamen || 0) + (c.seguroRiesgo || 0) +
        (c.portes || 0) + (c.gastosAdministracion || 0) + (c.comision || 0) + (c.prepago || 0);
      flujos.push(-pagoTotal);
    });

    const tirPeriodDecimal = this.calcularTIRDecimal(flujos);
    if (tirPeriodDecimal === null) return null;
    const tceaAnual = Math.pow(1 + tirPeriodDecimal, frecuenciaPago) - 1;
    return Number((tceaAnual * 100).toFixed(4));
  }

  // Retorna Duración en años
  calcularDuracion(cuotas: Cuota[], iPeriodo: number, frecuenciaPago: number): number {
    let sumaPonderada = 0;
    let sumaVP = 0;
    cuotas.forEach((c, idx) => {
      const periodo = idx + 1;
      const vp = Math.abs(c.flujo) / Math.pow(1 + iPeriodo, periodo);
      sumaPonderada += periodo * vp;
      sumaVP += vp;
    });
    if (sumaVP === 0) return 0;
    return Number((sumaPonderada / sumaVP / frecuenciaPago).toFixed(4));
  }

  // Retorna Convexidad en años^2
  calcularConvexidad(cuotas: Cuota[], iPeriodo: number, frecuenciaPago: number): number {
    let suma = 0;
    let sumaVP = 0;
    cuotas.forEach((c, idx) => {
      const periodo = idx + 1;
      const vp = Math.abs(c.flujo) / Math.pow(1 + iPeriodo, periodo);
      suma += periodo * (periodo + 1) * vp;
      sumaVP += vp;
    });
    if (sumaVP === 0) return 0;
    return Number(((suma / (sumaVP * Math.pow(1 + iPeriodo, 2))) / Math.pow(frecuenciaPago, 2)).toFixed(4));
  }

  calcularIndicadores(
    montoPrestamo: number,
    cuotas: Cuota[],
    costosIniciales: number,
    config: ConfiguracionPlan,
    frecuenciaPago: number
  ): IndicadoresFinancieros {
    // 1) Cálculo de tasas periódicas y flujos
    const tem = this.calcularTasaMensualDesdeConfig(config);
    const iPeriodo = this.calcularTasaPorPeriodoDesdeTEM(tem, frecuenciaPago);

    const flujos = [montoPrestamo - costosIniciales, ...cuotas.map(c => c.flujo)];
    
    const tasaDescuentoDecimal = config.tasaDescuento || 0; 

    // 2) Cálculo de indicadores
    const van = this.calcularVAN(flujos, tasaDescuentoDecimal, frecuenciaPago);
    const tirPct = this.calcularTIR(flujos, frecuenciaPago) || 0;
    const tcea = this.calcularTCEA(montoPrestamo, cuotas, costosIniciales, frecuenciaPago) || 0;
    const trea = tcea;
    const dur = this.calcularDuracion(cuotas, iPeriodo, frecuenciaPago);
    const conv = this.calcularConvexidad(cuotas, iPeriodo, frecuenciaPago);
    
    // TEA y TEM se convierten a % para el objeto final
    const teaPct = (Math.pow(1 + tem, 12) - 1) * 100;
    const temPct = tem * 100;

    const indicadores: IndicadoresFinancieros = {
      tir: Number(tirPct.toFixed(4)),
      van: Number(van.toFixed(2)),
      tcea: Number(tcea.toFixed(4)),
      trea: Number(trea.toFixed(4)),
      duracion: Number(dur.toFixed(4)),
      convexidad: Number(conv.toFixed(4)),
      tea: Number(teaPct.toFixed(4)), 
      tem: Number(temPct.toFixed(4)),
      tasaDescuento: Number((tasaDescuentoDecimal * 100).toFixed(4))
    };

    return indicadores;
  }
}