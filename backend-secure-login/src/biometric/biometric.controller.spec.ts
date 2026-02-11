// Mock modules BEFORE imports
jest.mock('@generated/prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

jest.mock('../prisma/prisma.service');
jest.mock('./biometric.service');
jest.mock('../auth/auth.service');

import { Test, TestingModule } from '@nestjs/testing';
import { BiometricController } from './biometric.controller';
import { BiometricService } from './biometric.service';
import { AuthService } from '../auth';
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

describe('BiometricController', () => {
  let controller: BiometricController;
  let biometricService: jest.Mocked<BiometricService>;
  let authService: jest.Mocked<AuthService>;

  const mockBiometricService = {
    generateRegistrationOptions: jest.fn(),
    verifyRegistration: jest.fn(),
    generateAuthenticationOptions: jest.fn(),
    verifyAuthentication: jest.fn(),
    listWebAuthnCredentials: jest.fn(),
    deleteWebAuthnCredential: jest.fn(),
    registerFace: jest.fn(),
    verifyFace: jest.fn(),
    listFaceDescriptors: jest.fn(),
    deleteFaceDescriptor: jest.fn(),
    getBiometricStatus: jest.fn(),
  };

  const mockAuthService = {
    biometricLogin: jest.fn(),
  };

  const mockRequest = {
    ip: '192.168.1.1',
    headers: {
      'user-agent': 'Mozilla/5.0',
    },
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BiometricController],
      providers: [
        {
          provide: BiometricService,
          useValue: mockBiometricService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<BiometricController>(BiometricController);
    biometricService = module.get(BiometricService);
    authService = module.get(AuthService);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  // ==================== WEBAUTHN ====================

  describe('POST /biometric/webauthn/registration/options', () => {
    it('debería generar opciones de registro WebAuthn', async () => {
      const mockOptions = {
        challenge: 'mock-challenge',
        rp: { name: 'Secure Login App', id: 'localhost' },
        user: {
          id: 'user-123',
          name: 'test@example.com',
          displayName: 'John Doe',
        },
      };

      mockBiometricService.generateRegistrationOptions.mockResolvedValue(mockOptions);

      const result = await controller.generateRegistrationOptions(mockUser);

      expect(result).toEqual(mockOptions);
      expect(biometricService.generateRegistrationOptions).toHaveBeenCalledWith('user-123');
    });
  });

  describe('POST /biometric/webauthn/registration/verify', () => {
    it('debería verificar y registrar credencial WebAuthn', async () => {
      const verifyDto = {
        credential: {
          id: 'mock-credential-id',
          type: 'public-key',
          rawId: 'mock-raw-id',
          response: {
            clientDataJSON: 'mock-client-data',
            attestationObject: 'mock-attestation',
            transports: ['usb', 'nfc'],
          },
        },
        deviceName: 'Mi dispositivo',
      };

      const mockCredential = {
        id: 'cred-123',
        credentialID: 'mock-credential-id',
        deviceName: 'Mi dispositivo',
        credentialDeviceType: 'singleDevice',
        transports: ['usb', 'nfc'],
        createdAt: new Date(),
        lastUsedAt: null,
      };

      mockBiometricService.verifyRegistration.mockResolvedValue(mockCredential);

      const result = await controller.verifyRegistration(mockUser, verifyDto);

      expect(result).toEqual(mockCredential);
      expect(biometricService.verifyRegistration).toHaveBeenCalledWith('user-123', verifyDto);
    });
  });

  describe('POST /biometric/webauthn/authentication/options', () => {
    it('debería generar opciones de autenticación WebAuthn', async () => {
      const optionsDto = { email: 'test@example.com' };
      const mockOptions = {
        challenge: 'mock-challenge',
        rpId: 'localhost',
        allowCredentials: [
          {
            id: 'cred-id',
            type: 'public-key',
            transports: ['usb'],
          },
        ],
      };

      mockBiometricService.generateAuthenticationOptions.mockResolvedValue(mockOptions);

      const result = await controller.generateAuthenticationOptions(optionsDto);

      expect(result).toEqual(mockOptions);
      expect(biometricService.generateAuthenticationOptions).toHaveBeenCalledWith(
        'test@example.com',
      );
    });
  });

  describe('POST /biometric/webauthn/authentication/verify', () => {
    it('debería verificar autenticación WebAuthn y retornar tokens', async () => {
      const verifyDto = {
        email: 'test@example.com',
        credential: {
          id: 'cred-id',
          type: 'public-key',
          rawId: 'raw-id',
          response: {
            clientDataJSON: 'client-data',
            authenticatorData: 'auth-data',
            signature: 'signature',
          },
        },
      };

      const mockAuthResponse = {
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockBiometricService.verifyAuthentication.mockResolvedValue(mockUser);
      mockAuthService.biometricLogin.mockResolvedValue(mockAuthResponse);

      const result = await controller.verifyAuthentication(verifyDto, mockRequest);

      expect(result).toEqual(mockAuthResponse);
      expect(biometricService.verifyAuthentication).toHaveBeenCalledWith(
        'test@example.com',
        verifyDto.credential,
      );
      expect(authService.biometricLogin).toHaveBeenCalledWith(
        'user-123',
        'webauthn',
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('debería manejar la falta de IP y user-agent', async () => {
      const verifyDto = {
        email: 'test@example.com',
        credential: { id: 'cred-id' },
      };

      const emptyReq = {
        ip: undefined,
        headers: {},
      } as unknown as Request;

      mockBiometricService.verifyAuthentication.mockResolvedValue(mockUser);
      mockAuthService.biometricLogin.mockResolvedValue({});

      await controller.verifyAuthentication(verifyDto, emptyReq);

      expect(authService.biometricLogin).toHaveBeenCalledWith(
        'user-123',
        'webauthn',
        'unknown',
        'unknown',
      );
    });
  });

  describe('GET /biometric/webauthn/credentials', () => {
    it('debería listar las credenciales WebAuthn del usuario', async () => {
      const mockCredentials = [
        {
          id: 'cred-1',
          credentialID: 'credential-id-1',
          deviceName: 'iPhone',
          credentialDeviceType: 'singleDevice',
          transports: ['usb'],
          createdAt: new Date(),
          lastUsedAt: new Date(),
        },
        {
          id: 'cred-2',
          credentialID: 'credential-id-2',
          deviceName: 'Android',
          credentialDeviceType: 'multiDevice',
          transports: ['nfc'],
          createdAt: new Date(),
          lastUsedAt: null,
        },
      ];

      mockBiometricService.listWebAuthnCredentials.mockResolvedValue(mockCredentials);

      const result = await controller.listWebAuthnCredentials(mockUser);

      expect(result).toEqual(mockCredentials);
      expect(biometricService.listWebAuthnCredentials).toHaveBeenCalledWith('user-123');
    });
  });

  describe('DELETE /biometric/webauthn/credentials/:id', () => {
    it('debería eliminar una credencial WebAuthn', async () => {
      const credentialId = 'cred-123';
      const mockResponse = { message: 'Credencial eliminada exitosamente' };

      mockBiometricService.deleteWebAuthnCredential.mockResolvedValue(mockResponse);

      const result = await controller.deleteWebAuthnCredential(mockUser, credentialId);

      expect(result).toEqual(mockResponse);
      expect(biometricService.deleteWebAuthnCredential).toHaveBeenCalledWith(
        'user-123',
        credentialId,
      );
    });
  });

  // ==================== FACIAL ====================

  describe('POST /biometric/facial/register', () => {
    it('debería registrar un descriptor facial', async () => {
      const registerDto = {
        descriptor: [0.1, 0.2, 0.3, 0.4],
        label: 'Mi rostro',
        deviceInfo: 'iPhone 12',
      };

      const mockFaceDescriptor = {
        id: 'face-123',
        label: 'Mi rostro',
        deviceInfo: 'iPhone 12',
        createdAt: new Date(),
        lastUsedAt: undefined,
      };

      mockBiometricService.registerFace.mockResolvedValue(mockFaceDescriptor);

      const result = await controller.registerFace(mockUser, registerDto);

      expect(result).toEqual(mockFaceDescriptor);
      expect(biometricService.registerFace).toHaveBeenCalledWith('user-123', registerDto);
    });
  });

  describe('POST /biometric/facial/verify', () => {
    it('debería verificar rostro y retornar tokens', async () => {
      const verifyDto = {
        email: 'test@example.com',
        descriptor: [0.1, 0.2, 0.3, 0.4],
      };

      const mockAuthResponse = {
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockBiometricService.verifyFace.mockResolvedValue(mockUser);
      mockAuthService.biometricLogin.mockResolvedValue(mockAuthResponse);

      const result = await controller.verifyFace(verifyDto, mockRequest);

      expect(result).toEqual(mockAuthResponse);
      expect(biometricService.verifyFace).toHaveBeenCalledWith(verifyDto);
      expect(authService.biometricLogin).toHaveBeenCalledWith(
        'user-123',
        'facial',
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('debería manejar la falta de IP y user-agent', async () => {
      const verifyDto = {
        email: 'test@example.com',
        descriptor: [0.1, 0.2, 0.3],
      };

      const emptyReq = {
        ip: undefined,
        headers: {},
      } as unknown as Request;

      mockBiometricService.verifyFace.mockResolvedValue(mockUser);
      mockAuthService.biometricLogin.mockResolvedValue({});

      await controller.verifyFace(verifyDto, emptyReq);

      expect(authService.biometricLogin).toHaveBeenCalledWith(
        'user-123',
        'facial',
        'unknown',
        'unknown',
      );
    });
  });

  describe('GET /biometric/facial/descriptors', () => {
    it('debería listar los descriptores faciales del usuario', async () => {
      const mockDescriptors = [
        {
          id: 'face-1',
          label: 'Descriptor 1',
          deviceInfo: 'iPhone',
          createdAt: new Date(),
          lastUsedAt: new Date(),
        },
        {
          id: 'face-2',
          label: 'Descriptor 2',
          deviceInfo: 'Android',
          createdAt: new Date(),
          lastUsedAt: undefined,
        },
      ];

      mockBiometricService.listFaceDescriptors.mockResolvedValue(mockDescriptors);

      const result = await controller.listFaceDescriptors(mockUser);

      expect(result).toEqual(mockDescriptors);
      expect(biometricService.listFaceDescriptors).toHaveBeenCalledWith('user-123');
    });
  });

  describe('DELETE /biometric/facial/descriptors/:id', () => {
    it('debería eliminar un descriptor facial', async () => {
      const descriptorId = 'face-123';
      const mockResponse = { message: 'Descriptor eliminado exitosamente' };

      mockBiometricService.deleteFaceDescriptor.mockResolvedValue(mockResponse);

      const result = await controller.deleteFaceDescriptor(mockUser, descriptorId);

      expect(result).toEqual(mockResponse);
      expect(biometricService.deleteFaceDescriptor).toHaveBeenCalledWith(
        'user-123',
        descriptorId,
      );
    });
  });

  // ==================== GENERAL ====================

  describe('GET /biometric/status', () => {
    it('debería retornar el estado biométrico del usuario', async () => {
      const mockStatus = {
        hasWebAuthn: true,
        hasFacial: true,
        webAuthnCount: 2,
        facialCount: 1,
        availableMethods: ['webauthn', 'facial'],
      };

      mockBiometricService.getBiometricStatus.mockResolvedValue(mockStatus);

      const result = await controller.getBiometricStatus(mockUser);

      expect(result).toEqual(mockStatus);
      expect(biometricService.getBiometricStatus).toHaveBeenCalledWith('user-123');
    });

    it('debería retornar estado sin métodos biométricos', async () => {
      const mockStatus = {
        hasWebAuthn: false,
        hasFacial: false,
        webAuthnCount: 0,
        facialCount: 0,
        availableMethods: [],
      };

      mockBiometricService.getBiometricStatus.mockResolvedValue(mockStatus);

      const result = await controller.getBiometricStatus(mockUser);

      expect(result).toEqual(mockStatus);
      expect(result.availableMethods).toHaveLength(0);
    });
  });
});
