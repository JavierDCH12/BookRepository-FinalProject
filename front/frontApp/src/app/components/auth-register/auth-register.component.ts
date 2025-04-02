import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserAuthServiceService } from '../../services/UserAuthService.service';
import { NAVIGATION_ROUTES } from '../../utils/constants';

@Component({
  selector: 'app-auth-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './auth-register.component.html',
  styleUrls: ['./auth-register.component.css']
})
export class AuthRegisterComponent {
  form: FormGroup;
  backendErrorMessage: string | null = null;
  successfulRegistration: boolean = false;

  constructor(
    private userAuthService: UserAuthServiceService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.form = this.formBuilder.group(
      {
        username: ['', [Validators.required, Validators.minLength(5)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(5)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: this.passwordsMatch }
    );
  }

  // Validador de contraseñas coincidentes 
  passwordsMatch(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordsDoNotMatch: true };
  }

  // Enviar formulario 
  onSubmit() {
    if (this.form.valid) {
      const { username, email, password } = this.form.value;

      this.userAuthService.registerUser(username, email, password).subscribe({
        next: () => {
          this.backendErrorMessage = null;
          this.successfulRegistration = true;
          setTimeout(() => {
            this.router.navigate([NAVIGATION_ROUTES.LOGIN]);
          }, 2000);
        },
        error: (error) => {
          console.error('Registration error:', error);
          if (error.error) {
            if (error.error.username) {
              this.backendErrorMessage = error.error.username[0];
            } else if (error.error.email) {
              this.backendErrorMessage = error.error.email[0];
            } else if (error.error.password) {
              this.backendErrorMessage = error.error.password[0];
            } else {
              this.backendErrorMessage = 'Error en el registro.';
            }
          }
        }
      });
    } else {
      this.backendErrorMessage = 'Por favor, completa correctamente el formulario.';
    }
  }

  // Navegar a la página de inicio de sesión
  navigateToLogin() {
    this.router.navigate([NAVIGATION_ROUTES.LOGIN]);
  }
}
