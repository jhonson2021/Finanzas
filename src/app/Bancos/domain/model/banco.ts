import { CostosIniciales } from "./costosIniciales";
import { CostosPeriodicos } from "./costosPeriodicos";

export interface Banco {
  id: number;
  nombre: string;
  sigla: string;
  logo: string;
  tasaAnual: number;
  tasaMensual: number;
  tipoTasa: string;
  plazoMaximo: number;
  montoMinimo: number;
  montoMaximo: number;
  descripcion: string;
  requisitos: string[];
  costosIniciales: CostosIniciales;
  costosPeriodicos: CostosPeriodicos;
}