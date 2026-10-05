export interface Shift {
  id: string;
  slug: string;
  workerId: string;
  workerName: string;
  date: string;
  startTime: string;
  endTime: string;
  hourlyWage: number;
  workplace: string;
  comments?: string;
  totalProfit: number;
}
