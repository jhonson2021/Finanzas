export interface ConfiguracionPlan {
  moneda: 'PEN' | 'USD';
  tipoTasa: 'EFECTIVA' | 'NOMINAL';
  capitalizacion?: 'MENSUAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  periodoGracia: number;      
  tipoGracia: 'NINGUNO' | 'TOTAL' | 'PARCIAL';
  tasaInteres: number;  
  tasaDescuento?: number;
}
