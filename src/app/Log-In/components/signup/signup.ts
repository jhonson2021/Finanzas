import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/authService';
import { User } from '../../domain/model/user';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css'],
})
export class Signup {
   currentStep: number = 1;
  errorMessage: string = '';
  successMessage: string = '';

  userData: User = {
    email: '',
    password: '',
    personalInfo: {
      nombre: '',
      telefono: '',
      dni: '',
      fechaNacimiento: ''
    },
    financialInfo: {
      ingresoMensual: 0,
      ocupacion: '',
      banco: '',
      tipoCuenta: ''
    }
  };

  confirmPassword: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    console.log('SignupComponent inicializado');
  }

  nextStep(): void {
    console.log('=== NEXT STEP LLAMADO ===');
    console.log('Paso actual:', this.currentStep);
    console.log('Datos del formulario:', this.userData);
    
    // Limpiar mensajes
    this.errorMessage = '';
    this.successMessage = '';

    if (this.currentStep === 1) {
      // Validar campos obligatorios del Paso 1
      if (!this.userData.email) {
        this.errorMessage = 'El email es obligatorio';
        console.log('❌ Error: Email vacío');
        return;
      }

      if (!this.userData.password) {
        this.errorMessage = 'La contraseña es obligatoria';
        console.log('❌ Error: Password vacío');
        return;
      }

      if (!this.confirmPassword) {
        this.errorMessage = 'Debes confirmar la contraseña';
        console.log('❌ Error: Confirm password vacío');
        return;
      }

      if (this.userData.password !== this.confirmPassword) {
        this.errorMessage = 'Las contraseñas no coinciden';
        console.log('❌ Error: Passwords no coinciden');
        return;
      }

      if (this.userData.password.length < 6) {
        this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
        console.log('❌ Error: Password muy corto');
        return;
      }

      if (!this.userData.personalInfo.nombre) {
        this.errorMessage = 'El nombre es obligatorio';
        console.log('❌ Error: Nombre vacío');
        return;
      }

      if (!this.userData.personalInfo.dni) {
        this.errorMessage = 'El DNI es obligatorio';
        console.log('❌ Error: DNI vacío');
        return;
      }

      // Si llegamos aquí, validación pasó
      console.log('✅ Validación exitosa, verificando email...');

      // Verificar si el email ya existe
      this.authService.checkEmailExists(this.userData.email).subscribe({
        next: (users) => {
          console.log('Verificación de email:', users);
          if (users.length > 0) {
            this.errorMessage = `❌ Este email ya está registrado. Usa otro email o inicia sesión.`;
            console.log('❌ Email ya existe en la base de datos');
          } else {
            console.log('✅ Email disponible, avanzando al paso 2');
            this.currentStep = 2;
            window.scrollTo(0, 0);
          }
        },
        error: (error) => {
          console.error('❌ Error al verificar email:', error);
          this.errorMessage = '❌ Error al verificar el email. Verifica que JSON Server esté corriendo en puerto 3001';
        }
      });
    }
  }

  previousStep(): void {
    console.log('⬅️ Volviendo al paso 1');
    this.currentStep = 1;
    this.errorMessage = '';
    this.successMessage = '';
    window.scrollTo(0, 0);
  }

  onSubmit(): void {
    console.log('=== ON SUBMIT LLAMADO ===');
    console.log('Datos completos a enviar:', this.userData);
    
    // Limpiar mensajes
    this.errorMessage = '';
    this.successMessage = '';

    // Validar Paso 2
    if (!this.userData.financialInfo.ocupacion) {
      this.errorMessage = 'La ocupación es obligatoria';
      console.log('❌ Error: Ocupación vacía');
      return;
    }

    if (!this.userData.financialInfo.banco) {
      this.errorMessage = 'Debes seleccionar un banco';
      console.log('❌ Error: Banco no seleccionado');
      return;
    }

    if (!this.userData.financialInfo.ingresoMensual || this.userData.financialInfo.ingresoMensual <= 0) {
      this.errorMessage = 'El ingreso mensual debe ser mayor a 0';
      console.log('❌ Error: Ingreso mensual inválido');
      return;
    }

    // Registrar usuario
    console.log('📤 Intentando registrar usuario...');
    this.authService.register(this.userData).subscribe({
      next: (user) => {
        console.log('✅ Usuario registrado exitosamente:', user);
        this.successMessage = '¡Registro exitoso! Redirigiendo al login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Error al registrar usuario:', error);
        this.errorMessage = 'Error al registrar el usuario. Verifica que JSON Server esté corriendo';
      }
    });
  }
}
