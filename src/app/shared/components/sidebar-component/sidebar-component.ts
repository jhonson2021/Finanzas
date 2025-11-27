import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '../../../Log-In/domain/model/user';

interface MenuItem {
  path: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-sidebar-component',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar-component.html',
  styleUrl: './sidebar-component.css',
})
export class SidebarComponent implements OnInit {
  @Input() isOpen: boolean = true;
  @Input() currentUser: User | null = null;
  @Output() onLogout = new EventEmitter<void>();

  menuItems: MenuItem[] = [
    { path: '/inicio', icon: 'home', label: 'Inicio' },
    { path: '/locales', icon: 'building', label: 'Locales' },
    { path: '/bancos', icon: 'bank', label: 'Bancos' },
    { path: '/mis-planes', icon: 'document', label: 'Mis Planes' }
  ];

  ngOnInit(): void {
    console.log('Sidebar inicializado con usuario:', this.currentUser);
  }

  logout(): void {
    this.onLogout.emit();
  }
}