import { ConfiguracionPlan } from './configurationPlan';
import { Cuota } from './cuota';
import { IndicadoresFinancieros } from './indicadoresFinancieros';

export interface PlanPago {
  id?: number; // Opcional, json-server lo genera automáticamente
  usuarioId: number;
  localId: number;
  bancoId: number;
  configuracion: ConfiguracionPlan;
  precioVenta: number;
  cuotaInicial: number;
  montoPrestamo: number;
  numAnios: number;
  cuotasPorAnio: number;
  frecuenciaPago: string;
  totalCuotas: number;
  diasPorAnio: number;
  cuotaFija: number;
  totalInteres: number;
  costosInicialesTotal: number;
  costosPeriodicos: any;
  indicadores: IndicadoresFinancieros;
  cuotas: Cuota[];
  createdAt: string;
}