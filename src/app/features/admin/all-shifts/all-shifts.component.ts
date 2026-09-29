import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ShiftService } from '../../../core/services/shift.service';
import { Shift } from '../../../core/models';

@Component({
  selector: 'app-all-shifts',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './all-shifts.component.html',
  styleUrls: ['./all-shifts.component.css']
})
export class AllShiftsComponent implements OnInit {
  filterForm: FormGroup;
  shifts: Shift[] = [];
  totalProfit = 0;
  totalHours = 0;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private shiftService: ShiftService
  ) {
    this.filterForm = this.fb.group({
      workerName: [''],
      place: [''],
      fromDate: [''],
      toDate: ['']
    });
  }

  ngOnInit(): void {
    this.fetchShifts();
  }

  fetchShifts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const { workerName, place, fromDate, toDate } = this.filterForm.value;

    this.shiftService.getAllShifts(
      workerName?.trim() || undefined,
      place?.trim() || undefined,
      fromDate || undefined,
      toDate || undefined
    ).subscribe({
      next: (data) => {
        this.isLoading = false;
        this.shifts = data.sort(
          (a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime()
        );
        this.calculateMetrics(this.shifts);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to fetch shift records.';
      }
    });
  }

  private calculateMetrics(list: Shift[]): void {
    this.totalProfit = Number(list.reduce((acc, s) => acc + (s.totalProfit || 0), 0).toFixed(2));
    this.totalHours = Number(list.reduce((acc, s) => {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      return acc + (diff / 60);
    }, 0).toFixed(1));
  }

  onFilter(): void {
    this.fetchShifts();
  }

  onReset(): void {
    this.filterForm.reset({
      workerName: '',
      place: '',
      fromDate: '',
      toDate: ''
    });
    this.fetchShifts();
  }
}
