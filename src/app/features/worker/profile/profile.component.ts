import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, NavbarComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  currentUser: User | null = null;
  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService
  ) {
    this.profileForm = this.fb.group({
      username: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      birthDate: ['', [Validators.required, this.ageValidator]]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.errorMessage = 'User session not found.';
      this.isLoading = false;
      return;
    }

    this.loadProfile();
  }

  isInvalid(fieldName: string): boolean {
    const control = this.profileForm.get(fieldName);
    return !!(control && control.touched && control.invalid);
  }

  hasError(fieldName: string, errorType: string): boolean {
    const control = this.profileForm.get(fieldName);
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

  loadProfile(): void {
    if (!this.currentUser) return;
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getWorkerById(this.currentUser.id).subscribe({
      next: (user) => {
        this.isLoading = false;
        this.profileForm.patchValue({
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          birthDate: user.birthDate
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to load profile details.';
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid || this.isSaving || !this.currentUser) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formValues = this.profileForm.getRawValue();
    const updatePayload: Partial<User> = {
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      birthDate: formValues.birthDate
    };

    this.userService.updateWorker(this.currentUser.id, updatePayload).subscribe({
      next: (updatedUser) => {
        this.isSaving = false;
        this.successMessage = 'Profile updated successfully!';
        const mergedUser = { ...this.currentUser, ...updatedUser };
        localStorage.setItem('currentUser', JSON.stringify(mergedUser));
        this.currentUser = mergedUser;
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.error?.message || 'Failed to update profile.';
      }
    });
  }
}
