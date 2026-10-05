import { Router, Request, Response } from 'express';
import { shifts } from '../db.js';
import { Shift } from '../models/shift.model.js';

const router = Router();

const calculateTotalProfit = (startTime: string, endTime: string, hourlyWage: number): number => {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let startTotal = sh * 60 + sm;
  let endTotal = eh * 60 + em;
  if (endTotal < startTotal) endTotal += 24 * 60;
  return Number(((endTotal - startTotal) / 60 * hourlyWage).toFixed(2));
};

router.get('/', (req: Request, res: Response) => {
  let result = [...shifts];
  const { workerName, place, fromDate, toDate } = req.query as Record<string, string>;

  if (workerName) result = result.filter(s => s.workerName.toLowerCase().includes(workerName.toLowerCase()));
  if (place) result = result.filter(s => s.workplace.toLowerCase().includes(place.toLowerCase()));
  if (fromDate) result = result.filter(s => s.date >= fromDate);
  if (toDate) result = result.filter(s => s.date <= toDate);

  return res.json(result);
});

router.get('/worker/:workerId', (req: Request, res: Response) => {
  const { workerId } = req.params;
  const { place, fromDate, toDate } = req.query as Record<string, string>;
  let result = shifts.filter(s => s.workerId === workerId);

  if (place) result = result.filter(s => s.workplace.toLowerCase().includes(place.toLowerCase()));
  if (fromDate) result = result.filter(s => s.date >= fromDate);
  if (toDate) result = result.filter(s => s.date <= toDate);

  return res.json(result);
});

router.get('/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const match = shifts.find(s => s.slug === slug);
  if (!match) {
    return res.status(404).json({ message: 'Shift not found.' });
  }
  return res.json(match);
});

router.post('/', (req: Request, res: Response) => {
  const payload = req.body as Shift;

  if (shifts.some(s => s.slug.toLowerCase() === payload.slug.trim().toLowerCase())) {
    return res.status(400).json({ message: 'Shift slug already exists.' });
  }

  const totalProfit = calculateTotalProfit(payload.startTime, payload.endTime, Number(payload.hourlyWage));
  const newShift: Shift = {
    ...payload,
    id: `s-${Date.now()}`,
    hourlyWage: Number(payload.hourlyWage),
    totalProfit
  };

  shifts.push(newShift);
  return res.status(201).json(newShift);
});

router.put('/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const payload = req.body as Partial<Shift>;
  const idx = shifts.findIndex(s => s.slug === slug);

  if (idx === -1) {
    return res.status(404).json({ message: 'Shift not found.' });
  }

  const startTime = payload.startTime || shifts[idx].startTime;
  const endTime = payload.endTime || shifts[idx].endTime;
  const hourlyWage = payload.hourlyWage !== undefined ? Number(payload.hourlyWage) : shifts[idx].hourlyWage;

  const totalProfit = calculateTotalProfit(startTime, endTime, hourlyWage);

  shifts[idx] = {
    ...shifts[idx],
    ...payload,
    hourlyWage,
    totalProfit
  };

  return res.json(shifts[idx]);
});

export default router;
