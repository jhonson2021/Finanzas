import { Routes } from '@angular/router';
import { Login } from './Log-In/components/login/login';
import { Signup } from './Log-In/components/signup/signup';
import { Bancos } from './Bancos/components/bancos/bancos';
import { Locales } from './Locales/pages/locales/locales';
import { Layout } from './shared/pages/layout/layout';
import { Perfil } from './Perfil/pages/perfil';
import { LocalDetalleComponent } from './Locales/components/local-detalle/local-detalle';
import { SimuladorComponent } from './Planes/components/simulador-pago/simulador';
import { PlanesListaComponent } from './Planes/pages/planes-lista.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  {
    path: '',
    component: Layout,
    children: [
      { path: 'inicio', component: Perfil },
      { path: 'locales', component: Locales },
      { path: 'local-detalle/:id', component: LocalDetalleComponent },
      { path: 'bancos', component: Bancos },
      { path: 'simulador', component: SimuladorComponent },
      { path: 'mis-planes', component: PlanesListaComponent },
    ]
  },
  { path: '**', redirectTo: '/login' }
];

