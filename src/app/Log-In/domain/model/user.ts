export interface User {
  id?: number;
  email: string;
  password: string;
  personalInfo: {
    nombre: string;
    telefono: string;
    dni: string;
    fechaNacimiento: string;
  };
  financialInfo: {
    ingresoMensual: number;
    ocupacion: string;
    banco: string;
    tipoCuenta: string;
  };
}