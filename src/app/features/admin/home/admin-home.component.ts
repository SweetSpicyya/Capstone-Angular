import { Component, OnInit } from '@angular/core';
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
  currentAdmin: User | null = null;
  totalWorkers = 0;
  totalShiftsCount = 0;
  totalCompanyPayout = 0;
  recentShifts: Shift[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private shiftService: ShiftService,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentAdmin = this.authService.getCurrentUser();
    this.loadAdminDashboard();
  }

  loadAdminDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      shifts: this.shiftService.getAllShifts(),

      workers: this.userService.getWorkerById('') // 혹은 전체 워커 목록 API
    }).subscribe({
      next: ({ shifts }) => {
        this.isLoading = false;
        this.totalShiftsCount = shifts.length;

        const sumProfit = shifts.reduce((acc, s) => acc + (s.totalProfit || 0), 0);
        this.totalCompanyPayout = Number(sumProfit.toFixed(2));

        this.recentShifts = [...shifts]
          .sort((a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime())
          .slice(0, 5);
      },
      error: () => {
        this.shiftService.getAllShifts().subscribe({
          next: (shifts) => {
            this.isLoading = false;
            this.totalShiftsCount = shifts.length;
            this.totalCompanyPayout = Number(shifts.reduce((acc, s) => acc + (s.totalProfit || 0), 0).toFixed(2));
            this.recentShifts = [...shifts]
              .sort((a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime())
              .slice(0, 5);
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.error?.message || 'Failed to load admin statistics.';
          }
        });
      }
    });
  }
}
