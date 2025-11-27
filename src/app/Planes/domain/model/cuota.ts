export interface Cuota {
  numero: number;
  fechaPago: string;
  saldoInicial: number;
  saldoInicialIndexado: number;
  interes: number;
  amortizacion: number;
  cuota: number;
  prepago: number;

  // Costos periódicos
  seguroDesgravamen: number;
  seguroRiesgo: number;
  comision: number;
  portes: number;
  gastosAdministracion: number;
  saldoFinal: number;
  flujo: number; 
}
