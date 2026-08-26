import 'dotenv/config';
import { generateToken } from './utils/generateToken';

// Admin token for testing
const token = generateToken({ userId: 1, roleId: 1 });
console.log(token);