import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/authService';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  private authService = inject(AuthService);

  constructor(private router: Router) {}

  onLogin(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: (users) => {
        if (users.length > 0) {
          this.authService.setCurrentUser(users[0]);
          this.successMessage = '¡Inicio de sesión exitoso!';
          setTimeout(() => {
            this.router.navigate(['/inicio']);
          }, 1000);
        } else {
          this.errorMessage = 'Email o contraseña incorrectos';
        }
      },
      error: (error) => {
        this.errorMessage = 'Error al conectar con el servidor';
        console.error(error);
      },
    });
  }
}
