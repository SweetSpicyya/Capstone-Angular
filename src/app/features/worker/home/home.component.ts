import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ShiftService } from '../../../core/services/shift.service';
import { AuthService } from '../../../core/services/auth.service';
import { Shift, User } from '../../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  currentUser = signal<User | null>(null);
  upcomingShift = signal<Shift | null>(null);
  pastShiftsThisWeek = signal<Shift[]>([]);
  totalHoursThisWeek = signal<number>(0);
  totalProfitThisWeek = signal<number>(0);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  constructor(
    private shiftService: ShiftService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser.set(this.authService.getCurrentUser());
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.shiftService.getMyShifts().subscribe({
      next: (shifts) => {
        this.processShifts(shifts || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to load shifts.');
      }
    });
  }

  private processShifts(shifts: Shift[]): void {
    const now = new Date();

    const futureShifts = shifts.filter(s => {
      const shiftDateTime = new Date(`${s.date}T${s.startTime}`);
      return shiftDateTime >= now;
    }).sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

    this.upcomingShift.set(futureShifts.length > 0 ? futureShifts[0] : null);

    const currentDay = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay);
    startOfWeek.setHours(0, 0, 0, 0);

    const pastList = shifts.filter(s => {
      const sDate = new Date(`${s.date}T${s.endTime}`);
      return sDate >= startOfWeek && sDate < now;
    });
    this.pastShiftsThisWeek.set(pastList);

    let sumProfit = 0;
    let sumMinutes = 0;

    pastList.forEach(s => {
      sumProfit += s.totalProfit || 0;
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      sumMinutes += diff;
    });

    this.totalProfitThisWeek.set(Number(sumProfit.toFixed(2)));
    this.totalHoursThisWeek.set(Number((sumMinutes / 60).toFixed(1)));
  }
}
