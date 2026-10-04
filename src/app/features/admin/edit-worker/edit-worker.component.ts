import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-admin-edit-worker',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './edit-worker.component.html',
  styleUrls: ['./edit-worker.component.css']
})
export class EditWorkerComponent implements OnInit {
  workerForm: FormGroup;
  workerId = '';
  workerData: User | null = null;
  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {
    this.workerForm = this.fb.group({
      username: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      birthDate: ['', [Validators.required, this.ageValidator]]
    });
  }

  ngOnInit(): void {
    this.workerId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.workerId) {
      this.router.navigate(['/admin/workers']);
      return;
    }

    this.loadWorker();
  }

  isInvalid(fieldName: string): boolean {
    const control = this.workerForm.get(fieldName);
    return !!(control && control.touched && control.invalid);
  }

  hasError(fieldName: string, errorType: string): boolean {
    const control = this.workerForm.get(fieldName);
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

  loadWorker(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getWorkerById(this.workerId).subscribe({
      next: (user) => {
        this.isLoading = false;
        this.workerData = user;
        this.workerForm.patchValue({
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          birthDate: user.birthDate
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to retrieve worker details.';
      }
    });
  }

  onSubmit(): void {
    if (this.workerForm.invalid || this.isSaving) {
      this.workerForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formValues = this.workerForm.getRawValue();
    const updatePayload: Partial<User> = {
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      birthDate: formValues.birthDate
    };

    this.userService.updateWorker(this.workerId, updatePayload).subscribe({
      next: (updatedUser) => {
        this.isSaving = false;
        this.successMessage = `Profile for ${updatedUser.firstName} ${updatedUser.lastName} updated successfully!`;
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.error?.message || 'Failed to update worker profile.';
      }
    });
  }
}
