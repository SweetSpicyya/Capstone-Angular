import { User } from './models/user.model.js';
import { Shift } from './models/shift.model.js';

export let users: User[] = [
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

export let shifts: Shift[] = [];
