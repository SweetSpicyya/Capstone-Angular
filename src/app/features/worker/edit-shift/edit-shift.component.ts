import { Component, OnInit, NgZone, ChangeDetectorRef, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ShiftService } from '../../../core/services/shift.service';
import { AuthService } from '../../../core/services/auth.service';
import { Shift, User } from '../../../core/models';

@Component({
  selector: 'app-edit-shift',
  standalone: true,
  imports: [ReactiveFormsModule, NavbarComponent],
  templateUrl: './edit-shift.component.html',
  styleUrls: ['./edit-shift.component.css']
})
export class EditShiftComponent implements OnInit {
  shiftForm: FormGroup;
  targetSlug = '';
  currentUser = signal<User | null>(null);
  calculatedHours = signal<number>(0);
  calculatedProfit = signal<number>(0);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private shiftService: ShiftService,
    private authService: AuthService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
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
    this.currentUser.set(this.authService.getCurrentUser());
    this.targetSlug = this.route.snapshot.paramMap.get('slug') || '';
    if (!this.targetSlug) {
      this.navigateBack();
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
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.shiftService.getShiftBySlug(this.targetSlug).subscribe({
      next: (shift: Shift) => {
        this.ngZone.run(() => {
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
          this.isLoading.set(false);
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to fetch shift details.');
          this.cdr.detectChanges();
        });
      }
    });
  }

  private recalculateSummary(): void {
    const { startTime, endTime, hourlyWage } = this.shiftForm.getRawValue();

    if (!startTime || !endTime || !hourlyWage || hourlyWage <= 0) {
      this.calculatedHours.set(0);
      this.calculatedProfit.set(0);
      this.cdr.detectChanges();
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
    this.calculatedHours.set(Number(diffHours.toFixed(2)));
    this.calculatedProfit.set(Number((diffHours * Number(hourlyWage)).toFixed(2)));
    this.cdr.detectChanges();
  }

  navigateBack(): void {
    if (this.currentUser()?.role === 'admin') {
      this.router.navigate(['/admin/shifts']);
    } else {
      this.router.navigate(['/shifts']);
    }
  }

  onSubmit(): void {
    if (this.shiftForm.invalid || this.isSubmitting()) {
      this.shiftForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

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
        this.ngZone.run(() => {
          this.isSubmitting.set(false);
          this.navigateBack();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to update shift.');
          this.cdr.detectChanges();
        });
      }
    });
  }
}
