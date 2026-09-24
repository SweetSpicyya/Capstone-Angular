import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from './features/worker/home/home.component';
import { MyShiftsComponent } from './features/worker/my-shifts/my-shifts.component';
import { AddShiftComponent } from './features/worker/add-shift/add-shift.component';
import { EditShiftComponent } from './features/worker/edit-shift/edit-shift.component';
import { ProfileComponent } from './features/worker/profile/profile.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'shifts', component: MyShiftsComponent, canActivate: [authGuard] },
  { path: 'shifts/new', component: AddShiftComponent, canActivate: [authGuard] },
  { path: 'shifts/edit/:slug', component: EditShiftComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '**', redirectTo: '' }
];
