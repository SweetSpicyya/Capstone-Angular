import { Router, Request, Response } from 'express';
import { users, shifts } from '../db.js';
import { User } from '../models/user.model.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const workers = users
    .filter(u => u.role === 'worker')
    .map(({ password, ...u }) => u);
  return res.json(workers);
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const found = users.find(u => u.id === id);
  if (!found) {
    return res.status(404).json({ message: 'Worker not found.' });
  }
  const { password, ...userWithoutPassword } = found;
  return res.json(userWithoutPassword);
});

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body as Partial<User>;
  const idx = users.findIndex(u => u.id === id);

  if (idx === -1) {
    return res.status(404).json({ message: 'Worker not found.' });
  }

  users[idx] = { ...users[idx], ...payload };
  const { password, ...updatedUser } = users[idx];
  return res.json(updatedUser);
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const userIdx = users.findIndex(u => u.id === id);

  if (userIdx === -1) {
    return res.status(404).json({ message: 'Worker not found.' });
  }

  users.splice(userIdx, 1);

  for (let i = shifts.length - 1; i >= 0; i--) {
    if (shifts[i].workerId === id) {
      shifts.splice(i, 1);
    }
  }

  return res.json({ success: true });
});

export default router;
