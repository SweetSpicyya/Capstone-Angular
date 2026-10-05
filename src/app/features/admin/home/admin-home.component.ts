import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ShiftService } from '../../../core/services/shift.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { Shift, User } from '../../../core/models';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [RouterLink, NavbarComponent],
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.css']
})
export class AdminHomeComponent implements OnInit {
  currentAdmin = signal<User | null>(null);
  totalWorkers = signal<number>(0);
  totalShiftsCount = signal<number>(0);
  totalCompanyPayout = signal<number>(0);
  recentShifts = signal<Shift[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  constructor(
    private shiftService: ShiftService,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentAdmin.set(this.authService.getCurrentUser());
    this.loadAdminDashboard();
  }

  loadAdminDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      shifts: this.shiftService.getAllShifts(),
      workers: this.userService.getWorkers()
    }).subscribe({
      next: ({ shifts, workers }) => {
        const shiftList = shifts || [];
        const workerList = workers || [];

        this.totalWorkers.set(workerList.length);
        this.totalShiftsCount.set(shiftList.length);

        const sumProfit = shiftList.reduce((acc, s) => acc + (s.totalProfit || 0), 0);
        this.totalCompanyPayout.set(Number(sumProfit.toFixed(2)));

        const sorted = [...shiftList].sort(
          (a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime()
        );
        this.recentShifts.set(sorted.slice(0, 5));
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to load admin statistics.');
      }
    });
  }
}
