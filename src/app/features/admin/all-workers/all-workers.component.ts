import { Component, OnInit, signal } from '@angular/core';
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
  workers = signal<User[]>([]);
  filteredWorkers = signal<User[]>([]);
  searchTerm = signal<string>('');
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.fetchWorkers();
  }

  fetchWorkers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.userService.getWorkers().subscribe({
      next: (data) => {
        const list = data || [];
        this.workers.set(list);
        this.filteredWorkers.set(list);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || err.message || 'Failed to retrieve workers list.');
      }
    });
  }

  onSearchChange(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm.set(term);

    if (!term.trim()) {
      this.filteredWorkers.set(this.workers());
    } else {
      this.filteredWorkers.set(
        this.workers().filter(w =>
          `${w.firstName} ${w.lastName}`.toLowerCase().includes(term) ||
          w.email.toLowerCase().includes(term) ||
          w.username.toLowerCase().includes(term)
        )
      );
    }
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
        this.successMessage.set(`Worker ${worker.firstName} ${worker.lastName} has been successfully removed.`);
        const updated = this.workers().filter(w => w.id !== worker.id);
        this.workers.set(updated);
        this.filteredWorkers.set(updated);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to delete worker.');
      }
    });
  }
}
