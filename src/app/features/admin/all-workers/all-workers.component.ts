import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-all-workers',
  standalone: true,
  imports: [RouterLink, NavbarComponent],
  templateUrl: './all-workers.component.html',
  styleUrls: ['./all-workers.component.css']
})
export class AllWorkersComponent implements OnInit {
  workers: User[] = [];
  filteredWorkers: User[] = [];
  searchTerm = '';
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.fetchWorkers();
  }

  fetchWorkers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getWorkers().subscribe({
      next: (data) => {
        this.isLoading = false;
        this.workers = data;
        this.filterWorkers();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to retrieve workers list.';
      }
    });
  }

  onSearchChange(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filterWorkers();
  }

  filterWorkers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredWorkers = [...this.workers];
      return;
    }

    this.filteredWorkers = this.workers.filter(w =>
      `${w.firstName} ${w.lastName}`.toLowerCase().includes(this.searchTerm) ||
      w.email.toLowerCase().includes(this.searchTerm) ||
      w.username.toLowerCase().includes(this.searchTerm)
    );
  }

  calculateAge(birthDateStr: string): number {
    if (!birthDateStr) return 0;
    const birth = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  onDelete(worker: User): void {
    const confirmed = confirm(
      `Are you sure you want to remove worker "${worker.firstName} ${worker.lastName}" (${worker.username})?\nAll shifts associated with this worker will also be deleted.`
    );

    if (!confirmed) return;

    this.userService.deleteWorker(worker.id).subscribe({
      next: () => {
        this.successMessage = `Worker ${worker.firstName} ${worker.lastName} has been successfully removed.`;
        this.workers = this.workers.filter(w => w.id !== worker.id);
        this.filterWorkers();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete worker.';
      }
    });
  }
}
