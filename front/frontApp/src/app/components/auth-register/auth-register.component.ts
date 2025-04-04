import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
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
  successfulRegistration = false;
  isLoading = false;

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
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordsMatch }
    );
  }

  /**
   * Validador personalizado para comprobar que ambas contraseñas coinciden
   */
  passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword
      ? { passwordsDoNotMatch: true }
      : null;
  }

  /**
   * Manejo del envío del formulario de registro
   */
  onSubmit(): void {
    if (this.form.valid) {
      const { username, email, password } = this.form.value;
      this.isLoading = true;
      this.backendErrorMessage = null;

      this.userAuthService.registerUser(username, email, password).subscribe({
        next: () => {
          this.successfulRegistration = true;
          this.isLoading = false;
          setTimeout(() => {
            this.router.navigate([NAVIGATION_ROUTES.LOGIN]);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Registration error:', error);

          if (error?.error) {
            this.backendErrorMessage =
              error.error.username?.[0] ||
              error.error.email?.[0] ||
              error.error.password?.[0] ||
              'Error en el registro.';
          } else {
            this.backendErrorMessage = 'Error inesperado al registrar.';
          }
        }
      });
    } else {
      this.backendErrorMessage = 'Por favor, completa correctamente el formulario.';
      this.form.markAllAsTouched(); 
    }
  }

 
  navigateToLogin(): void {
    this.router.navigate([NAVIGATION_ROUTES.LOGIN]);
  }
}
