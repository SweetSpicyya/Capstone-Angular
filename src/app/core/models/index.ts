
export interface User {
  id: string;
  email: string;
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  role: 'worker' | 'admin';
}

export interface Shift {
  id?: string;
  slug: string;
  workerId: string;
  workerName: string;
  date: string;
  startTime: string;
  endTime: string;
  hourlyWage: number;
  workplace: string;
  totalProfit: number;
  comments?: string;
}
