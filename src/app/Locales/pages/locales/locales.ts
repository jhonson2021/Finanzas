import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocalesService } from '../../domain/services/locales.service';
import { Local } from '../../domain/model/local';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-locales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './locales.html',
  styleUrl: './locales.css',
})
export class Locales  implements OnInit {
  locales: Local[] = [];
  loading: boolean = true;
  error: string = '';
  filtroTipo: string = 'todos';

  constructor(
    private localesService: LocalesService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarLocales();
  }

  cargarLocales(): void {
    this.loading = true;
    this.localesService.getLocales().subscribe({
      next: (data) => {
        this.locales = data;
        this.loading = false;
        this.cd.detectChanges(); 
        console.log('Locales cargados:', data);
      },
      error: (error) => {
        this.error = 'Error al cargar los locales';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  get localesFiltrados(): Local[] {
    if (this.filtroTipo === 'todos') {
      return this.locales;
    }
    return this.locales.filter(local => local.tipo === this.filtroTipo);
  }

  filtrarPorTipo(tipo: string): void {
    this.filtroTipo = tipo;
  }

  verDetalle(localId: number): void {
    this.router.navigate(['/local-detalle', localId]);
  }
}

