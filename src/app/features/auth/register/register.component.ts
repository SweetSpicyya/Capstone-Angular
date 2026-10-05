import { Component, NgZone, ChangeDetectorRef, signal } from '@angular/core';
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
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      birthDate: ['', [Validators.required, this.ageValidator]],
      role: ['worker', Validators.required]
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
    if (this.registerForm.invalid || this.isLoading()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.isLoading.set(false);
          this.router.navigate(['/login']);
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'Registration failed.');
          this.cdr.detectChanges();
        });
      }
    });
  }
}
