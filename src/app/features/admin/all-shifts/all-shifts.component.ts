import { Component, OnInit, signal } from '@angular/core';
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
  shifts = signal<Shift[]>([]);
  totalProfit = signal<number>(0);
  totalHours = signal<number>(0);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

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
    this.isLoading.set(true);
    this.errorMessage.set('');

    const { workerName, place, fromDate, toDate } = this.filterForm.value;

    this.shiftService.getAllShifts(
      workerName?.trim() || undefined,
      place?.trim() || undefined,
      fromDate || undefined,
      toDate || undefined
    ).subscribe({
      next: (data) => {
        const sorted = (data || []).sort(
          (a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime()
        );
        this.shifts.set(sorted);
        this.calculateMetrics(sorted);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to fetch shift records.');
      }
    });
  }

  private calculateMetrics(list: Shift[]): void {
    const profit = list.reduce((acc, s) => acc + (s.totalProfit || 0), 0);
    this.totalProfit.set(Number(profit.toFixed(2)));

    const hours = list.reduce((acc, s) => {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      return acc + (diff / 60);
    }, 0);
    this.totalHours.set(Number(hours.toFixed(1)));
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
