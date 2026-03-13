import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

let connectionString = process.env.DATABASE_URL;
if (process.env.NODE_ENV === 'test') connectionString = process.env.TEST_DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export default prisma;