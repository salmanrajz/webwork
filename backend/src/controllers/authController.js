import { login, register } from '../services/authService.js';

export const registerUser = async (req, res) => {
  const result = await register(req.body);
  res.status(201).json({ success: true, data: result });
};

export const loginUser = async (req, res) => {
  const result = await login(req.body);
  res.json({ success: true, data: result });
};
