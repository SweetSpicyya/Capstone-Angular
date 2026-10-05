import { Component, OnInit, NgZone, ChangeDetectorRef, signal } from '@angular/core';
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
  currentUser = signal<User | null>(null);
  calculatedHours = signal<number>(0);
  calculatedProfit = signal<number>(0);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private shiftService: ShiftService,
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
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
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUser.set(user);

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

  onSubmit(): void {
    if (this.shiftForm.invalid || this.isLoading()) {
      this.shiftForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    const user = this.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const formValues = this.shiftForm.value;
    const payload = {
      slug: formValues.slug.trim(),
      workerId: user.id,
      workerName: `${user.firstName} ${user.lastName}`.trim(),
      date: formValues.date,
      startTime: formValues.startTime,
      endTime: formValues.endTime,
      hourlyWage: Number(formValues.hourlyWage),
      workplace: formValues.workplace.trim(),
      comments: formValues.comments ? formValues.comments.trim() : ''
    };

    this.shiftService.createShift(payload).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.isLoading.set(false);
          this.router.navigate(['/shifts']);
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || err.message || 'Failed to save shift.');
          this.cdr.detectChanges();
        });
      }
    });
  }
}
