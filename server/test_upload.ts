import jwt from 'jsonwebtoken';
import { env } from './src/config/env.js';

// generate a token
const token = jwt.sign(
  { userId: 'test-user', walletAddress: 'test-wallet' },
  env.JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('TOKEN:', token);
