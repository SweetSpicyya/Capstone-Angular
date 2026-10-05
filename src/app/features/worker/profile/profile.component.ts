import { Component, OnInit, NgZone, ChangeDetectorRef, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
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
  currentUser = signal<User | null>(null);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
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
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentUser.set(user);
    this.loadProfile(user.id);
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

  loadProfile(userId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.userService.getWorkerById(userId).subscribe({
      next: (userData) => {
        this.ngZone.run(() => {
          this.currentUser.set(userData);
          this.profileForm.patchValue({
            username: userData.username,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            birthDate: userData.birthDate
          });
          this.isLoading.set(false);
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to retrieve profile details.');
          this.cdr.detectChanges();
        });
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid || this.isSaving()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const current = this.currentUser();
    if (!current) return;

    this.isSaving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const formValues = this.profileForm.getRawValue();
    const updatePayload: Partial<User> = {
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      birthDate: formValues.birthDate
    };

    this.userService.updateWorker(current.id, updatePayload).subscribe({
      next: (updatedUser) => {
        this.ngZone.run(() => {
          this.isSaving.set(false);
          this.currentUser.set(updatedUser);

          // 브라우저 로컬 세션 동기화
          if (typeof window !== 'undefined') {
            const raw = localStorage.getItem('currentUser');
            if (raw) {
              const parsed = JSON.parse(raw);
              localStorage.setItem('currentUser', JSON.stringify({ ...parsed, ...updatedUser }));
            }
          }

          this.successMessage.set('Profile successfully updated!');
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.isSaving.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to update profile.');
          this.cdr.detectChanges();
        });
      }
    });
  }
}
