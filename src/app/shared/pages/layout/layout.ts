import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar-component/sidebar-component';
import { TopbarComponent } from '../../components/topbar-component/topbar-component';
import { AuthService } from '../../../Log-In/services/authService';
import { User } from '../../../Log-In/domain/model/user';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, TopbarComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit {
  currentUser: User | null = null;
  sidebarOpen: boolean = true;

  private authService = inject(AuthService);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}