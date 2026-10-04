import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ShiftService } from '../../../core/services/shift.service';
import { UserService } from '../../../core/services/user.service';
import { Shift, User } from '../../../core/models';

@Component({
  selector: 'app-worker-shifts',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './worker-shifts.component.html',
  styleUrls: ['./worker-shifts.component.css']
})
export class WorkerShiftsComponent implements OnInit {
  workerId = '';
  worker: User | null = null;
  shifts: Shift[] = [];
  filterForm: FormGroup;
  totalProfit = 0;
  totalHours = 0;
  isLoading = true;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private shiftService: ShiftService,
    private userService: UserService
  ) {
    this.filterForm = this.fb.group({
      place: [''],
      fromDate: [''],
      toDate: ['']
    });
  }

  ngOnInit(): void {
    this.workerId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.workerId) {
      this.router.navigate(['/admin/workers']);
      return;
    }

    this.loadWorkerAndShifts();
  }

  loadWorkerAndShifts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const { place, fromDate, toDate } = this.filterForm.value;

    forkJoin({
      worker: this.userService.getWorkerById(this.workerId),
      shifts: this.shiftService.getShiftsByWorkerId(
        this.workerId,
        place?.trim() || undefined,
        fromDate || undefined,
        toDate || undefined
      )
    }).subscribe({
      next: ({ worker, shifts }) => {
        this.isLoading = false;
        this.worker = worker;
        this.shifts = shifts.sort(
          (a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime()
        );
        this.calculateMetrics(this.shifts);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to retrieve worker or shift records.';
      }
    });
  }

  fetchShiftsOnly(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const { place, fromDate, toDate } = this.filterForm.value;

    this.shiftService.getShiftsByWorkerId(
      this.workerId,
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
        this.errorMessage = err.error?.message || 'Failed to filter shifts.';
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
    this.fetchShiftsOnly();
  }

  onReset(): void {
    this.filterForm.reset({
      place: '',
      fromDate: '',
      toDate: ''
    });
    this.fetchShiftsOnly();
  }
}
