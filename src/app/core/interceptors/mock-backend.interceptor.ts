import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { of, throwError, delay } from 'rxjs';
import { User, Shift } from '../models';

const USERS_KEY = 'backend_db_users';
const SHIFTS_KEY = 'backend_db_shifts';

const getFromStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : fallback;
};

const saveToStorage = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

const SEED_USERS: User[] = [
  {
    id: 'u-admin',
    email: 'admin@shifts.com',
    username: 'admin123!',
    password: 'password123!',
    firstName: 'System',
    lastName: 'Admin',
    birthDate: '1985-05-10',
    role: 'admin'
  },
  {
    id: 'u-worker-1',
    email: 'john@shifts.com',
    username: 'john123!',
    password: 'password123!',
    firstName: 'John',
    lastName: 'Doe',
    birthDate: '1995-03-15',
    role: 'worker'
  },
  {
    id: 'u-worker-2',
    email: 'jane@shifts.com',
    username: 'jane123!',
    password: 'password123!',
    firstName: 'Jane',
    lastName: 'Smith',
    birthDate: '2000-08-20',
    role: 'worker'
  }
];

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const { url, method, body, params } = req;

  if (typeof window !== 'undefined' && !localStorage.getItem(USERS_KEY)) {
    saveToStorage(USERS_KEY, SEED_USERS);
  }

  let users = getFromStorage<User[]>(USERS_KEY, []);
  let shifts = getFromStorage<Shift[]>(SHIFTS_KEY, []);
  const currentUser = getFromStorage<User | null>('currentUser', null);

  if (url.endsWith('/api/auth/register') && method === 'POST') {
    const payload = body as User;
    if (users.some(u => u.username === payload.username)) {
      return throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'Username already exists.' } }));
    }
    if (users.some(u => u.email === payload.email)) {
      return throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'Email already in use.' } }));
    }
    const newUser: User = { ...payload, id: `u-${Date.now()}` };
    users.push(newUser);
    saveToStorage(USERS_KEY, users);
    return of(new HttpResponse({ status: 200, body: newUser })).pipe(delay(300));
  }

  if (url.endsWith('/api/auth/login') && method === 'POST') {
    const { username, password } = body as any;
    const match = users.find(u => u.username === username && u.password === password);
    if (!match) {
      return throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'Invalid username or password.' } }));
    }
    return of(new HttpResponse({ status: 200, body: match })).pipe(delay(300));
  }

  if (url.endsWith('/api/auth/reset') && method === 'POST') {
    const { username, email } = body as any;
    const idx = users.findIndex(u => u.username === username && u.email === email);
    if (idx === -1) {
      return throwError(() => new HttpErrorResponse({ status: 404, error: { message: 'No matching user found.' } }));
    }
    const target = users[idx];
    users = users.filter(u => u.id !== target.id);
    shifts = shifts.filter(s => s.workerId !== target.id);
    saveToStorage(USERS_KEY, users);
    saveToStorage(SHIFTS_KEY, shifts);
    return of(new HttpResponse({ status: 200, body: { success: true } })).pipe(delay(300));
  }

  if (url.endsWith('/api/shifts/my') && method === 'GET') {
    if (!currentUser) {
      return throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'Unauthorized' } }));
    }
    let result = shifts.filter(s => s.workerId === currentUser.id);
    const place = params.get('place');
    const fromDate = params.get('fromDate');
    const toDate = params.get('toDate');

    if (place) result = result.filter(s => s.workplace.toLowerCase().includes(place.toLowerCase()));
    if (fromDate) result = result.filter(s => s.date >= fromDate);
    if (toDate) result = result.filter(s => s.date <= toDate);

    return of(new HttpResponse({ status: 200, body: result })).pipe(delay(200));
  }

  if (url.endsWith('/api/shifts') && method === 'GET') {
    let result = [...shifts];
    const workerName = params.get('workerName');
    const place = params.get('place');
    const fromDate = params.get('fromDate');
    const toDate = params.get('toDate');

    if (workerName) result = result.filter(s => s.workerName.toLowerCase().includes(workerName.toLowerCase()));
    if (place) result = result.filter(s => s.workplace.toLowerCase().includes(place.toLowerCase()));
    if (fromDate) result = result.filter(s => s.date >= fromDate);
    if (toDate) result = result.filter(s => s.date <= toDate);

    return of(new HttpResponse({ status: 200, body: result })).pipe(delay(200));
  }

  if (url.includes('/api/shifts/worker/') && method === 'GET') {
    const workerId = url.split('/').pop()?.split('?')[0] || '';
    let result = shifts.filter(s => s.workerId === workerId);
    const place = params.get('place');
    const fromDate = params.get('fromDate');
    const toDate = params.get('toDate');

    if (place) result = result.filter(s => s.workplace.toLowerCase().includes(place.toLowerCase()));
    if (fromDate) result = result.filter(s => s.date >= fromDate);
    if (toDate) result = result.filter(s => s.date <= toDate);

    return of(new HttpResponse({ status: 200, body: result })).pipe(delay(200));
  }

  if (url.endsWith('/api/shifts') && method === 'POST') {
    const payload = body as Shift;
    if (shifts.some(s => s.slug.toLowerCase() === payload.slug.trim().toLowerCase())) {
      return throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'Shift slug already exists.' } }));
    }

    const [startH, startM] = payload.startTime.split(':').map(Number);
    const [endH, endM] = payload.endTime.split(':').map(Number);
    let startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;
    if (endTotal < startTotal) endTotal += 24 * 60;
    const hours = (endTotal - startTotal) / 60;
    const totalProfit = Number((hours * payload.hourlyWage).toFixed(2));

    const newShift: Shift = {
      ...payload,
      id: `s-${Date.now()}`,
      totalProfit
    };

    shifts.push(newShift);
    saveToStorage(SHIFTS_KEY, shifts);
    return of(new HttpResponse({ status: 200, body: newShift })).pipe(delay(400));
  }

  if (url.includes('/api/shifts/') && method === 'PUT') {
    const slug = url.split('/').pop() || '';
    const payload = body as Partial<Shift>;
    const idx = shifts.findIndex(s => s.slug === slug);
    if (idx === -1) {
      return throwError(() => new HttpErrorResponse({ status: 404, error: { message: 'Shift not found.' } }));
    }

    let totalProfit = shifts[idx].totalProfit;
    const startTime = payload.startTime || shifts[idx].startTime;
    const endTime = payload.endTime || shifts[idx].endTime;
    const hourlyWage = payload.hourlyWage ?? shifts[idx].hourlyWage;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;
    if (endTotal < startTotal) endTotal += 24 * 60;
    totalProfit = Number(((endTotal - startTotal) / 60 * hourlyWage).toFixed(2));

    shifts[idx] = { ...shifts[idx], ...payload, totalProfit };
    saveToStorage(SHIFTS_KEY, shifts);
    return of(new HttpResponse({ status: 200, body: shifts[idx] })).pipe(delay(400));
  }

  if (url.endsWith('/api/workers') && method === 'GET') {
    const workerList = users.filter(u => u.role === 'worker');
    return of(new HttpResponse({ status: 200, body: workerList })).pipe(delay(200));
  }

  if (url.includes('/api/workers/') && method === 'GET') {
    const id = url.split('/').pop() || '';
    const found = users.find(u => u.id === id);
    if (!found) {
      return throwError(() => new HttpErrorResponse({ status: 404, error: { message: 'Worker not found.' } }));
    }
    return of(new HttpResponse({ status: 200, body: found })).pipe(delay(200));
  }

  if (url.includes('/api/workers/') && method === 'PUT') {
    const id = url.split('/').pop() || '';
    const payload = body as Partial<User>;
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) {
      return throwError(() => new HttpErrorResponse({ status: 404, error: { message: 'Worker not found.' } }));
    }
    users[idx] = { ...users[idx], ...payload };
    saveToStorage(USERS_KEY, users);
    return of(new HttpResponse({ status: 200, body: users[idx] })).pipe(delay(300));
  }

  if (url.includes('/api/workers/') && method === 'DELETE') {
    const id = url.split('/').pop() || '';
    users = users.filter(u => u.id !== id);
    shifts = shifts.filter(s => s.workerId !== id);
    saveToStorage(USERS_KEY, users);
    saveToStorage(SHIFTS_KEY, shifts);
    return of(new HttpResponse({ status: 200, body: { success: true } })).pipe(delay(300));
  }

  return next(req);
};
