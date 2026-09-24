import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ShiftService } from '../../../core/services/shift.service';
import { Shift } from '../../../core/models';

@Component({
  selector: 'app-edit-shift',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './edit-shift.component.html',
  styleUrls: ['./edit-shift.component.css']
})
export class EditShiftComponent implements OnInit {
  shiftForm: FormGroup;
  targetSlug = '';
  calculatedHours = 0;
  calculatedProfit = 0;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private shiftService: ShiftService
  ) {
    this.shiftForm = this.fb.group({
      slug: [{ value: '', disabled: true }],
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      hourlyWage: ['', [Validators.required, Validators.min(0.01)]],
      workplace: ['', Validators.required],
      comments: ['']
    }, { validators: this.timeRangeValidator });
  }

  ngOnInit(): void {
    this.targetSlug = this.route.snapshot.paramMap.get('slug') || '';
    if (!this.targetSlug) {
      this.router.navigate(['/shifts']);
      return;
    }

    this.loadShiftDetails();
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

  loadShiftDetails(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.shiftService.getShiftBySlug(this.targetSlug).subscribe({
      next: (shift: Shift) => {
        this.isLoading = false;
        this.shiftForm.patchValue({
          slug: shift.slug,
          date: shift.date,
          startTime: shift.startTime,
          endTime: shift.endTime,
          hourlyWage: shift.hourlyWage,
          workplace: shift.workplace,
          comments: shift.comments || ''
        });
        this.recalculateSummary();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to fetch shift details.';
      }
    });
  }

  private recalculateSummary(): void {
    const { startTime, endTime, hourlyWage } = this.shiftForm.getRawValue();

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
    if (this.shiftForm.invalid || this.isSubmitting) {
      this.shiftForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValues = this.shiftForm.getRawValue();
    const payload: Partial<Shift> = {
      date: formValues.date,
      startTime: formValues.startTime,
      endTime: formValues.endTime,
      hourlyWage: Number(formValues.hourlyWage),
      workplace: formValues.workplace.trim(),
      comments: formValues.comments ? formValues.comments.trim() : ''
    };

    this.shiftService.updateShift(this.targetSlug, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/shifts']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || err.message || 'Failed to update shift.';
      }
    });
  }
}
