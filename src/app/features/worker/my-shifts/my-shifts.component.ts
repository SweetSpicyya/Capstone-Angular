import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ShiftService } from '../../../core/services/shift.service';
import { Shift } from '../../../core/models';

@Component({
  selector: 'app-my-shifts',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './my-shifts.component.html',
  styleUrls: ['./my-shifts.component.css']
})
export class MyShiftsComponent implements OnInit {
  filterForm: FormGroup;
  shifts = signal<Shift[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private shiftService: ShiftService
  ) {
    this.filterForm = this.fb.group({
      place: [''],
      fromDate: [''],
      toDate: ['']
    });
  }

  ngOnInit(): void {
    this.fetchShifts();
  }

  fetchShifts(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const { place, fromDate, toDate } = this.filterForm.value;

    this.shiftService.getMyShifts(
      place?.trim() || undefined,
      fromDate || undefined,
      toDate || undefined
    ).subscribe({
      next: (data) => {
        const sorted = (data || []).sort(
          (a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime()
        );
        this.shifts.set(sorted);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to retrieve your shifts.');
      }
    });
  }

  onFilter(): void {
    this.fetchShifts();
  }

  onReset(): void {
    this.filterForm.reset({
      place: '',
      fromDate: '',
      toDate: ''
    });
    this.fetchShifts();
  }
}
