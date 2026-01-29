import { PrismaClient, Role } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Seed Script
 * 
 * Crea datos iniciales para desarrollo y testing.
 * Incluye un usuario ADMIN y un usuario CLIENT de ejemplo.
 * 
 * Ejecutar con: npx prisma db seed
 */
async function main() {
  console.log('🌱 Starting seed...');

  // Hash de password por defecto (Password123!)
  const hashedPassword = await bcrypt.hash('Password123!', 12);

  // Crear usuario ADMIN
  const admin = await prisma.user.upsert({
    where: { email: 'admin@secure-login.com' },
    update: {},
    create: {
      email: 'admin@secure-login.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      isActive: true,
      preferences: {
        theme: 'dark',
        language: 'es',
        notifications: true,
      },
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Crear usuario CLIENT de ejemplo
  const client = await prisma.user.upsert({
    where: { email: 'client@secure-login.com' },
    update: {},
    create: {
      email: 'client@secure-login.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: Role.CLIENT,
      isActive: true,
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: false,
      },
    },
  });

  console.log('✅ Client user created:', client.email);

  // Crear algunos logs de ejemplo para auditoría
  await prisma.securityLog.create({
    data: {
      userId: admin.id,
      action: 'ACCOUNT_CREATED',
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
      metadata: {
        note: 'Initial admin account creation',
      },
    },
  });

  await prisma.securityLog.create({
    data: {
      userId: client.id,
      action: 'ACCOUNT_CREATED',
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
      metadata: {
        note: 'Initial client account creation',
      },
    },
  });

  console.log('✅ Security logs created');
  console.log('\n📋 Default credentials:');
  console.log('   Admin: admin@secure-login.com / Password123!');
  console.log('   Client: client@secure-login.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });