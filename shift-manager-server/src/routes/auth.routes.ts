import { Router, Request, Response } from 'express';
import { users } from '../db.js';
import { User } from '../models/user.model.js';

const router = Router();

router.post('/register', (req: Request, res: Response) => {
  const payload = req.body as User;

  if (users.some(u => u.username === payload.username)) {
    return res.status(400).json({ message: 'Username already exists.' });
  }
  if (users.some(u => u.email === payload.email)) {
    return res.status(400).json({ message: 'Email already in use.' });
  }

  const newUser: User = {
    ...payload,
    id: `u-${Date.now()}`
  };

  users.push(newUser);
  const { password, ...userWithoutPassword } = newUser;
  return res.status(200).json(userWithoutPassword);
});

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const match = users.find(u => u.username === username && u.password === password);

  if (!match) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const { password: _, ...userWithoutPassword } = match;
  return res.status(200).json(userWithoutPassword);
});

export default router;
