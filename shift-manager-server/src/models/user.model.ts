export interface User {
  id: string;
  email: string;
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  role: 'admin' | 'worker';
}
