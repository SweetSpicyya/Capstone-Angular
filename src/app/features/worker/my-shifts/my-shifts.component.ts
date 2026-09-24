import { Component, OnInit } from '@angular/core';
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
  shifts: Shift[] = [];
  isLoading = false;
  errorMessage = '';

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
    this.isLoading = true;
    this.errorMessage = '';

    const { place, fromDate, toDate } = this.filterForm.value;

    this.shiftService.getMyShifts(place, fromDate, toDate).subscribe({
      next: (data) => {
        this.isLoading = false;
        this.shifts = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to retrieve shifts.';
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
