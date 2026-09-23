import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ShiftService } from '../../../core/services/shift.service';
import { AuthService } from '../../../core/services/auth.service';
import { Shift, User } from '../../../core/models';

@Component({
  selector: 'app-worker-home',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  currentUser: User | null = null;
  upcomingShift: Shift | null = null;
  pastShiftsThisWeek: Shift[] = [];
  totalHoursThisWeek = 0;
  totalProfitThisWeek = 0;
  isLoading = true;
  errorMessage = '';

  constructor(
    private shiftService: ShiftService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.shiftService.getMyShifts().subscribe({
      next: (shifts) => {
        this.isLoading = false;
        this.processShifts(shifts);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to load shifts.';
      }
    });
  }

  private processShifts(shifts: Shift[]): void {
    const now = new Date();

    const futureShifts = shifts
      .map(s => ({ shift: s, startDt: new Date(`${s.date}T${s.startTime}`) }))
      .filter(item => item.startDt >= now)
      .sort((a, b) => a.startDt.getTime() - b.startDt.getTime());

    this.upcomingShift = futureShifts.length > 0 ? futureShifts[0].shift : null;

    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const pastShifts = shifts.filter(s => {
      const shiftDate = new Date(`${s.date}T${s.endTime}`);
      return shiftDate >= startOfWeek && shiftDate < now;
    });

    this.pastShiftsThisWeek = pastShifts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    this.totalProfitThisWeek = Number(pastShifts.reduce((acc, s) => acc + (s.totalProfit || 0), 0).toFixed(2));
    this.totalHoursThisWeek = Number(pastShifts.reduce((acc, s) => {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      return acc + diff / 60;
    }, 0).toFixed(1));
  }
}
