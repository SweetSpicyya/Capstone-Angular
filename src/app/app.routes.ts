import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from './features/worker/home/home.component';
import { MyShiftsComponent } from './features/worker/my-shifts/my-shifts.component';
import { AddShiftComponent } from './features/worker/add-shift/add-shift.component';
import { EditShiftComponent } from './features/worker/edit-shift/edit-shift.component';
import { ProfileComponent } from './features/worker/profile/profile.component';
import { AdminHomeComponent } from './features/admin/home/admin-home.component';
import { AllShiftsComponent } from './features/admin/all-shifts/all-shifts.component';
import { AllWorkersComponent } from './features/admin/all-workers/all-workers.component';
import { EditWorkerComponent } from './features/admin/edit-worker/edit-worker.component';
import { WorkerShiftsComponent } from './features/admin/worker-shifts/worker-shifts.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Worker routes
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'shifts', component: MyShiftsComponent, canActivate: [authGuard] },
  { path: 'shifts/new', component: AddShiftComponent, canActivate: [authGuard] },
  { path: 'shifts/edit/:slug', component: EditShiftComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },

  // Admin routes
  { path: 'admin', component: AdminHomeComponent, canActivate: [adminGuard] },
  { path: 'admin/shifts', component: AllShiftsComponent, canActivate: [adminGuard] },
  { path: 'admin/workers', component: AllWorkersComponent, canActivate: [adminGuard] },
  { path: 'admin/workers/:id/edit', component: EditWorkerComponent, canActivate: [adminGuard] },
  { path: 'admin/workers/:id/shifts', component: WorkerShiftsComponent, canActivate: [adminGuard] },

  // Auth routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '**', redirectTo: '' }
];
