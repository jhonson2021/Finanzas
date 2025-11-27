import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-topbar-component',
  imports: [CommonModule],
  templateUrl: './topbar-component.html',
  styleUrl: './topbar-component.css',
})
export class TopbarComponent {
  @Input() title: string = 'Sistema de Créditos Hipotecarios';
  @Output() onToggleSidebar = new EventEmitter<void>();

  toggleSidebar(): void {
    this.onToggleSidebar.emit();
  }
}