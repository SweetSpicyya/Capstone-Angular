import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  resetForm: FormGroup;
  errorMessage = '';
  isResetOpen = false;
  resetMessage = '';
  isLoading = false;
  isResetLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, this.usernameValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.resetForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  usernameValidator(control: AbstractControl) {
    const val = control.value || '';
    const hasLetter = /[a-zA-Z]/.test(val);
    const hasNumber = /[0-9]/.test(val);
    const hasSpecial = /[^a-zA-Z0-9]/.test(val);

    if (val.length < 6 || !hasLetter || !hasNumber || !hasSpecial) {
      return { invalidUsername: true };
    }
    return null;
  }

  onLogin(): void {
    if (this.loginForm.invalid || this.isLoading) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (user) => {
        this.isLoading = false;
        if (user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || err.message || 'Login failed.';
      }
    });
  }

  openResetModal(): void {
    this.isResetOpen = true;
    this.resetMessage = '';
    this.resetForm.reset();
  }

  closeResetModal(): void {
    this.isResetOpen = false;
  }

  onResetSubmit(): void {
    if (this.resetForm.invalid || this.isResetLoading) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { username, email } = this.resetForm.value;
    const confirm = window.confirm(`Resetting password will delete all user data for "${username}". Proceed?`);
    if (!confirm) return;

    this.isResetLoading = true;
    this.resetMessage = '';

    this.authService.resetAccount({ username, email }).subscribe({
      next: () => {
        this.isResetLoading = false;
        alert('Your account has been deleted. Please register again.');
        this.closeResetModal();
        this.router.navigate(['/register']);
      },
      error: (err) => {
        this.isResetLoading = false;
        this.resetMessage = err.error?.message || err.message || 'Reset failed.';
      }
    });
  }
}
