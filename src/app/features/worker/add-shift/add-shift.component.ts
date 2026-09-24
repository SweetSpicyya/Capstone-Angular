import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ShiftService } from '../../../core/services/shift.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-add-shift',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './add-shift.component.html',
  styleUrls: ['./add-shift.component.css']
})
export class AddShiftComponent implements OnInit {
  shiftForm: FormGroup;
  currentUser: User | null = null;
  calculatedHours = 0;
  calculatedProfit = 0;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private shiftService: ShiftService,
    private authService: AuthService,
    private router: Router
  ) {
    this.shiftForm = this.fb.group({
      slug: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9-_]+$/)]],
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      hourlyWage: ['', [Validators.required, Validators.min(0.01)]],
      workplace: ['', Validators.required],
      comments: ['']
    }, { validators: this.timeRangeValidator });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.shiftForm.valueChanges.subscribe(() => {
      this.recalculateSummary();
    });
  }

  isInvalid(fieldName: string): boolean {
    const control = this.shiftForm.get(fieldName);
    return !!(control && control.touched && control.invalid);
  }

  isTimeRangeInvalid(): boolean {
    const startCtrl = this.shiftForm.get('startTime');
    const endCtrl = this.shiftForm.get('endTime');
    return !!(this.shiftForm.hasError('invalidTimeRange') && startCtrl?.touched && endCtrl?.touched);
  }

  timeRangeValidator(group: AbstractControl) {
    const start = group.get('startTime')?.value;
    const end = group.get('endTime')?.value;
    if (!start || !end) return null;
    return start === end ? { invalidTimeRange: true } : null;
  }

  private recalculateSummary(): void {
    const { startTime, endTime, hourlyWage } = this.shiftForm.value;

    if (!startTime || !endTime || !hourlyWage || hourlyWage <= 0) {
      this.calculatedHours = 0;
      this.calculatedProfit = 0;
      return;
    }

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let startMin = sh * 60 + sm;
    let endMin = eh * 60 + em;

    if (endMin < startMin) {
      endMin += 24 * 60;
    }

    const diffHours = (endMin - startMin) / 60;
    this.calculatedHours = Number(diffHours.toFixed(2));
    this.calculatedProfit = Number((diffHours * Number(hourlyWage)).toFixed(2));
  }

  onSubmit(): void {
    if (this.shiftForm.invalid || this.isLoading) {
      this.shiftForm.markAllAsTouched();
      return;
    }

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formValues = this.shiftForm.value;
    const payload = {
      slug: formValues.slug.trim(),
      workerId: this.currentUser.id,
      workerName: `${this.currentUser.firstName} ${this.currentUser.lastName}`,
      date: formValues.date,
      startTime: formValues.startTime,
      endTime: formValues.endTime,
      hourlyWage: Number(formValues.hourlyWage),
      workplace: formValues.workplace.trim(),
      comments: formValues.comments ? formValues.comments.trim() : ''
    };

    this.shiftService.createShift(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/shifts']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || err.message || 'Failed to save shift.';
      }
    });
  }
}
