import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../models/index.js';
import { validate, schemas } from '../utils/validation.js';

dotenv.config();

const {
  JWT_SECRET = 'development-secret',
  JWT_EXPIRES_IN = '1d'
} = process.env;

const generateToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

export const register = async (payload) => {
  const data = validate(schemas.register, payload);

  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    role: data.role,
    passwordHash
  });

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    }
  };
};

export const login = async (payload) => {
  const data = validate(schemas.login, payload);

  const user = await User.findOne({ where: { email: data.email } });
  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(data.password, user.passwordHash);
  if (!isMatch) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('Account disabled');
    err.statusCode = 403;
    throw err;
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    }
  };
};
