import { Component, OnInit, signal } from '@angular/core';
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
  worker = signal<User | null>(null);
  shifts = signal<Shift[]>([]);
  filterForm: FormGroup;
  totalProfit = signal<number>(0);
  totalHours = signal<number>(0);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

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
    this.isLoading.set(true);
    this.errorMessage.set('');

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
        this.worker.set(worker);
        const sorted = (shifts || []).sort(
          (a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime()
        );
        this.shifts.set(sorted);
        this.calculateMetrics(sorted);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to retrieve worker or shift records.');
      }
    });
  }

  fetchShiftsOnly(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const { place, fromDate, toDate } = this.filterForm.value;

    this.shiftService.getShiftsByWorkerId(
      this.workerId,
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
        this.errorMessage.set(err.error?.message || 'Failed to filter shifts.');
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
