# Backend - Sistema de Login Seguro

Backend desarrollado con NestJS, PostgreSQL y Prisma para el proyecto de Desarrollo de Software Seguro.

## 🚀 Características

- ✅ Autenticación JWT con refresh tokens
- ✅ Guards personalizados (Auth, Roles)
- ✅ Rate limiting (protección contra brute force)
- ✅ Validación robusta de datos
- ✅ Logging de eventos de seguridad
- ✅ Manejo centralizado de errores
- ✅ Headers de seguridad con Helmet
- ✅ CORS configurado
- ✅ Hashing de contraseñas con bcrypt (12 salt rounds)

## 📋 Prerequisitos

- Node.js 18+ 
- PostgreSQL 15+
- npm o yarn

## 🛠️ Instalación

### 1. Clonar el repositorio e instalar dependencias

```bash
cd backend-secure-login
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus valores:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/secure_login_db?schema=public"
JWT_ACCESS_SECRET="generar-secreto-seguro-aqui"
JWT_REFRESH_SECRET="generar-otro-secreto-seguro-aqui"
```

**Generar secrets seguros:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Configurar PostgreSQL

**Opción A: PostgreSQL local**

```sql
CREATE DATABASE secure_login_db;
```

**Opción B: Docker**

```bash
docker run --name postgres-secure-login \
  -e POSTGRES_PASSWORD=tu_password \
  -e POSTGRES_DB=secure_login_db \
  -p 5432:5432 \
  -d postgres:15
```

### 4. Ejecutar migraciones de Prisma

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Sembrar datos iniciales (opcional)

```bash
npx prisma db seed
```

Esto crea:
- Admin: `admin@secure-login.com` / `Password123!`
- Client: `client@secure-login.com` / `Password123!`

## 🎯 Ejecución

### Desarrollo

```bash
npm run start:dev
```

La aplicación estará disponible en `http://localhost:3001/api`

### Producción

```bash
npm run build
npm run start:prod
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📡 Endpoints

### Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Registrar usuario | No |
| POST | `/api/auth/login` | Iniciar sesión | No |
| POST | `/api/auth/refresh` | Renovar tokens | No* |
| POST | `/api/auth/logout` | Cerrar sesión | Sí |
| GET | `/api/auth/me` | Usuario actual | Sí |

*Requiere refresh token en el body

### Ejemplos de uso

**Registro:**

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

**Acceder a ruta protegida:**

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🗂️ Estructura del Proyecto

```
src/
├── common/                    # Módulo común
│   ├── decorators/           # Decorators personalizados
│   ├── guards/               # Guards (Auth, Roles)
│   ├── filters/              # Exception filters
│   ├── interceptors/         # Interceptors (Logging)
│   └── enums/                # Enums (Role)
├── prisma/                    # Módulo Prisma
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── auth/                      # Módulo de autenticación
│   ├── dto/                  # DTOs
│   ├── strategies/           # Passport strategies
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   └── auth.module.ts
├── app.module.ts
└── main.ts
```

## 🔒 Seguridad Implementada

### Autenticación y Autorización
- JWT con access tokens (15 min) y refresh tokens (7 días)
- Token rotation en refresh
- Revocación de tokens en logout
- Guards globales para proteger rutas
- Role-based access control (RBAC)

### Validación y Sanitización
- ValidationPipe global con class-validator
- Whitelist automática (remueve props no definidas)
- Sanitización de errores (no expone detalles internos)

### Rate Limiting
- 10 requests por minuto por IP
- Protección contra brute force en login

### Headers de Seguridad
- Helmet configurado
- CORS restrictivo
- XSS protection
- Clickjacking protection

### Base de Datos
- Prepared statements (Prisma)
- Hashing de contraseñas (bcrypt, 12 rounds)
- Índices para performance
- Logging de eventos de seguridad

## 🛠️ Utilidades

### Prisma Studio (Visualizador de BD)

```bash
npx prisma studio
```

### Generar nuevos secretos JWT

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Limpiar y resetear BD

```bash
npx prisma migrate reset
```

### Crear nueva migración

```bash
npx prisma migrate dev --name nombre_migracion
```

## 📊 Logging

Los logs incluyen:
- Requests entrantes y salientes
- Eventos de autenticación (login, logout, registro)
- Errores con stack traces (solo en desarrollo)
- Queries de BD (solo en desarrollo)

## 🐛 Debugging

Para habilitar logs detallados:

```env
NODE_ENV=development
```

Esto mostrará:
- Queries SQL de Prisma
- Logs debug de requests/responses
- Stack traces completos de errores

## 📝 Notas

- Las contraseñas deben tener mínimo 8 caracteres, incluir mayúscula, minúscula, número y símbolo especial
- Los refresh tokens se rotan automáticamente en cada renovación
- Los tokens revocados no se pueden reutilizar
- Todos los eventos de seguridad se registran en la tabla `security_logs`

## 🚧 Próximos Pasos (Fase 2)

- [ ] Integración de WebAuthn para huella digital
- [ ] Integración de Face-API.js para reconocimiento facial
- [ ] Módulo de usuarios (CRUD)
- [ ] Dashboards diferenciados por rol
- [ ] Pruebas de seguridad con OWASP ZAP