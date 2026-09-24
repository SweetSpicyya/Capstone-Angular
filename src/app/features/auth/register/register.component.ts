import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(6), this.specialCharValidator]],
      password: ['', [Validators.required, Validators.minLength(8), this.specialCharValidator]],
      birthDate: ['', [Validators.required, this.ageValidator]]
    });
  }

  isInvalid(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return !!(control && control.touched && control.invalid);
  }

  hasError(fieldName: string, errorType: string): boolean {
    const control = this.registerForm.get(fieldName);
    return !!(control && control.touched && control.hasError(errorType));
  }

  private specialCharValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const hasSpecial = /[^a-zA-Z0-9]/.test(control.value);
    return hasSpecial ? null : { specialCharRequired: true };
  }

  private ageValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const birthDate = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 6 || age > 130) {
      return { invalidAge: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.isLoading) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      ...this.registerForm.value,
      role: 'worker' as const
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
