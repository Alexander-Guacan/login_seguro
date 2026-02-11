
jest.mock('@generated/prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

jest.mock('../prisma/prisma.service');

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/tokens.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Request } from 'express';

enum Role {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
}

interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  preferences: any;
}

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
    biometricLogin: jest.fn(),
  };

  const mockRequest = {
    ip: '192.168.1.1',
    get: jest.fn().mockReturnValue('Mozilla/5.0'),
  } as unknown as Request;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    role: Role.CLIENT,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    preferences: null,
  };

  const mockAuthResponse = {
    user: {
      id: mockUser.id,
      email: mockUser.email,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      role: mockUser.role,
      isActive: mockUser.isActive,
      createdAt: mockUser.createdAt,
      updatedAt: mockUser.updatedAt,
      preferences: mockUser.preferences,
    },
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-123',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /auth/register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      firstName: 'Jane',
      lastName: 'Smith',
      role: Role.CLIENT,
    };

    it('debería registrar un nuevo usuario exitosamente', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto, mockRequest);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.register).toHaveBeenCalledWith(
        registerDto,
        '192.168.1.1',
        'Mozilla/5.0',
      );
      expect(authService.register).toHaveBeenCalledTimes(1);
    });

    it('debería usar "unknown" cuando falta la dirección IP', async () => {
      const reqWithoutIp = { ...mockRequest, ip: undefined };
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      await controller.register(registerDto, reqWithoutIp as Request);

      expect(authService.register).toHaveBeenCalledWith(
        registerDto,
        'unknown',
        'Mozilla/5.0',
      );
    });

    it('debería usar "unknown" cuando falta el user-agent', async () => {
      const reqWithoutUA = {
        ...mockRequest,
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as Request;
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      await controller.register(registerDto, reqWithoutUA);

      expect(authService.register).toHaveBeenCalledWith(
        registerDto,
        '192.168.1.1',
        'unknown',
      );
    });

    it('debería manejar la falta de IP y user-agent', async () => {
      const emptyReq = {
        ip: undefined,
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as Request;
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      await controller.register(registerDto, emptyReq);

      expect(authService.register).toHaveBeenCalledWith(
        registerDto,
        'unknown',
        'unknown',
      );
    });
  });

  describe('POST /auth/login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    it('debería iniciar sesión exitosamente', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto, mockRequest);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.login).toHaveBeenCalledWith(
        loginDto,
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('debería manejar la falta de IP y user-agent', async () => {
      const emptyReq = {
        ip: undefined,
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as Request;
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      await controller.login(loginDto, emptyReq);

      expect(authService.login).toHaveBeenCalledWith(
        loginDto,
        'unknown',
        'unknown',
      );
    });
  });

  describe('POST /auth/refresh', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'refresh-token-123',
    };

    it('debería refrescar los tokens exitosamente', async () => {
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      mockAuthService.refreshTokens.mockResolvedValue(newTokens);

      const result = await controller.refresh(refreshTokenDto, mockRequest);

      expect(result).toEqual(newTokens);
      expect(authService.refreshTokens).toHaveBeenCalledWith(
        'refresh-token-123',
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('debería manejar la falta de IP y user-agent', async () => {
      const emptyReq = {
        ip: undefined,
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as Request;
      mockAuthService.refreshTokens.mockResolvedValue({
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      });

      await controller.refresh(refreshTokenDto, emptyReq);

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        'refresh-token-123',
        'unknown',
        'unknown',
      );
    });
  });

  describe('POST /auth/logout', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'refresh-token-123',
    };

    it('debería cerrar sesión exitosamente', async () => {
      const logoutResponse = { message: 'Logout exitoso' };
      mockAuthService.logout.mockResolvedValue(logoutResponse);

      const result = await controller.logout(
        mockUser,
        refreshTokenDto,
        mockRequest,
      );

      expect(result).toEqual(logoutResponse);
      expect(authService.logout).toHaveBeenCalledWith(
        'user-123',
        'refresh-token-123',
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('debería manejar la falta de IP y user-agent', async () => {
      const emptyReq = {
        ip: undefined,
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as Request;
      mockAuthService.logout.mockResolvedValue({ message: 'Logout exitoso' });

      await controller.logout(mockUser, refreshTokenDto, emptyReq);

      expect(authService.logout).toHaveBeenCalledWith(
        'user-123',
        'refresh-token-123',
        'unknown',
        'unknown',
      );
    });
  });

  describe('GET /auth/me', () => {
    it('debería retornar el usuario sin contraseña', async () => {
      const result = await controller.getMe(mockUser);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        preferences: mockUser.preferences,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('debería manejar usuario con preferencias', async () => {
      const userWithPrefs: User = {
        ...mockUser,
        preferences: { theme: 'dark', language: 'es' },
      };

      const result = await controller.getMe(userWithPrefs);

      expect(result.preferences).toEqual({ theme: 'dark', language: 'es' });
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('POST /auth/login-biometric', () => {
    it('debería iniciar sesión con WebAuthn exitosamente', async () => {
      const body = { userId: 'user-123', method: 'webauthn' as const };
      mockAuthService.biometricLogin.mockResolvedValue(mockAuthResponse);

      const result = await controller.loginBiometric(body, mockRequest);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.biometricLogin).toHaveBeenCalledWith(
        'user-123',
        'webauthn',
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('debería iniciar sesión con reconocimiento facial exitosamente', async () => {
      const body = { userId: 'user-123', method: 'facial' as const };
      mockAuthService.biometricLogin.mockResolvedValue(mockAuthResponse);

      const result = await controller.loginBiometric(body, mockRequest);

      expect(authService.biometricLogin).toHaveBeenCalledWith(
        'user-123',
        'facial',
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('debería manejar la falta de IP y user-agent', async () => {
      const body = { userId: 'user-123', method: 'webauthn' as const };
      const emptyReq = {
        ip: undefined,
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as Request;
      mockAuthService.biometricLogin.mockResolvedValue(mockAuthResponse);

      await controller.loginBiometric(body, emptyReq);

      expect(authService.biometricLogin).toHaveBeenCalledWith(
        'user-123',
        'webauthn',
        'unknown',
        'unknown',
      );
    });
  });
});