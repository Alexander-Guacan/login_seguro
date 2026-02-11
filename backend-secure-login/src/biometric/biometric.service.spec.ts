
jest.mock('@generated/prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

jest.mock('../prisma/prisma.service');


jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn(),
  verifyRegistrationResponse: jest.fn(),
  generateAuthenticationOptions: jest.fn(),
  verifyAuthenticationResponse: jest.fn(),
}));

jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn().mockReturnValue({ toString: () => 'encrypted-data' }),
    decrypt: jest.fn().mockReturnValue({ toString: () => '[0.1, 0.2, 0.3]' }),
  },
  enc: {
    Utf8: {},
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BiometricService } from './biometric.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import * as CryptoJS from 'crypto-js';

describe('BiometricService', () => {
  let service: BiometricService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    authenticator: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    faceDescriptor: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    securityLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    currentChallenge: null,
    authenticators: [],
    faceDescriptors: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BiometricService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BiometricService>(BiometricService);
    prismaService = module.get(PrismaService);

    // Configurar variables de entorno
    process.env.RP_ID = 'localhost';
    process.env.RP_NAME = 'Test App';
    process.env.ORIGIN = 'http://localhost:3000';
    process.env.FACE_ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('WebAuthn - Registro', () => {
    describe('generateRegistrationOptions', () => {
      it('debería generar opciones de registro exitosamente', async () => {
        const mockOptions = {
          challenge: 'test-challenge-123',
          rp: { name: 'Test App', id: 'localhost' },
          user: { id: 'user-123', name: 'test@example.com', displayName: 'John Doe' },
        };

        mockPrismaService.user.findUnique.mockResolvedValue({
          ...mockUser,
          authenticators: [
            {
              credentialID: Buffer.from([1, 2, 3]),
              transports: ['usb', 'nfc'],
            },
          ],
        });
        
        (generateRegistrationOptions as jest.Mock).mockResolvedValue(mockOptions);
        mockPrismaService.user.update.mockResolvedValue({
          ...mockUser,
          preferences: {
            currentChallenge: 'test-challenge-123',
          },
        });
        

        const result = await service.generateRegistrationOptions('user-123');

        expect(result).toEqual(mockOptions);
        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          include: { authenticators: true },
        });
        expect(generateRegistrationOptions).toHaveBeenCalledWith(
          expect.objectContaining({
            rpName: 'Test App',
            rpID: 'localhost',
            userName: 'test@example.com',
            userDisplayName: 'John Doe',
            
            excludeCredentials: expect.arrayContaining([
              expect.objectContaining({
                type: 'public-key',
                transports: ['usb', 'nfc'],
              }),
            ]),
            attestationType: 'none',
            authenticatorSelection: expect.objectContaining({
              authenticatorAttachment: 'platform',
              residentKey: 'preferred',
              userVerification: 'preferred',
            }),
          }),
        );
      });

      it('debería generar opciones sin credenciales existentes', async () => {
        const mockOptions = {
          challenge: 'test-challenge-456',
          rp: { name: 'Test App', id: 'localhost' },
          user: { id: 'user-123', name: 'test@example.com', displayName: 'John Doe' },
        };

        
        mockPrismaService.user.findUnique.mockResolvedValue({
          ...mockUser,
          authenticators: [], 
        });
        
        (generateRegistrationOptions as jest.Mock).mockResolvedValue(mockOptions);
        
        mockPrismaService.user.update.mockResolvedValue({
          ...mockUser,
          preferences: {
            currentChallenge: 'test-challenge-456',
          },
        });

        const result = await service.generateRegistrationOptions('user-123');

        expect(result).toEqual(mockOptions);
        expect(generateRegistrationOptions).toHaveBeenCalledWith(
          expect.objectContaining({
            rpName: 'Test App',
            rpID: 'localhost',
            userName: 'test@example.com',
            userDisplayName: 'John Doe',
            excludeCredentials: [], 
          }),
        );
      });

      it('debería lanzar NotFoundException si el usuario no existe', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue(null);

        await expect(
          service.generateRegistrationOptions('user-999'),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('verifyRegistration', () => {
      it('debería verificar y registrar credencial exitosamente', async () => {
        const verifyDto = {
          credential: {
            id: 'credential-id-123',
            rawId: 'credential-id-123',
            response: {
              clientDataJSON: 'client-data',
              attestationObject: 'attestation-object',
            },
            type: 'public-key',
          },
          deviceName: 'iPhone 15',
        };

        const mockVerification = {
          verified: true,
          registrationInfo: {
            credentialID: new Uint8Array([1, 2, 3]),
            credentialPublicKey: new Uint8Array([4, 5, 6]),
            counter: 0,
            credentialDeviceType: 'singleDevice',
            credentialBackedUp: false,
            origin: 'http://localhost:3000',
            rpID: 'localhost',
          },
        };

        const mockAuthenticator = {
          id: 'auth-123',
          credentialID: Buffer.from([1, 2, 3]),
          credentialPublicKey: Buffer.from([4, 5, 6]),
          counter: 0,
          transports: ['usb', 'nfc'],
          deviceName: 'iPhone 15',
          userId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrismaService.user.findUnique.mockResolvedValue({
          ...mockUser,
          preferences: {
            currentChallenge: 'valid-challenge', 
          },
        });

        (verifyRegistrationResponse as jest.Mock).mockResolvedValue(mockVerification);
        mockPrismaService.$transaction.mockImplementation(async (callback) => {
          // Simular la ejecución de la transacción
          return callback(mockPrismaService);
        });

        mockPrismaService.authenticator.create.mockResolvedValue(mockAuthenticator);

        mockPrismaService.user.update.mockResolvedValue({
          ...mockUser,
          preferences: null, // Challenge limpiado después del registro
        });
       

        const result = await service.verifyRegistration('user-123', verifyDto);

        expect(result).toEqual({
          id: 'auth-123',
          credentialID: expect.any(Buffer),
          deviceName: 'iPhone 15',
          credentialDeviceType: undefined,
          transports: ['usb', 'nfc'],
          createdAt: expect.any(Date),
          lastUsedAt: undefined,
        });
        expect(verifyRegistrationResponse).toHaveBeenCalledWith({
          response: verifyDto.credential,
          expectedChallenge: 'valid-challenge',
          expectedOrigin: process.env.ORIGIN || 'http://localhost:3000',
          expectedRPID: process.env.RP_ID || 'localhost',
        });
        expect(prismaService.authenticator.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            userId: 'user-123',
            credentialID: expect.any(Uint8Array),
            credentialPublicKey: expect.any(Buffer),
            counter: BigInt(0),
            credentialDeviceType: 'singleDevice',
            credentialBackedUp: false,
            transports: expect.any(Array),
            deviceName: 'iPhone 15',
          }),
        });
      });

      it('debería lanzar BadRequestException si no hay challenge', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue({
          ...mockUser,
          preferences: null,
        });

        await expect(
          service.verifyRegistration('user-123', {
            credential: {} as any,
            deviceName: 'Test',
          }),
        ).rejects.toThrow(BadRequestException);

        await expect(
          service.verifyRegistration('user-123', {
            credential: {} as any,
            deviceName: 'Test',
          }),
        ).rejects.toThrow('Challenge no encontrado');
      });

      it('debería lanzar BadRequestException si la verificación falla', async () => {
        
        mockPrismaService.user.findUnique.mockResolvedValue({
          ...mockUser,
          preferences: {
            currentChallenge: 'valid-challenge',
          },
        });

        // Mock con verified: false - el servicio lanza BadRequestException internamente
        // que es capturado por el catch y re-lanzado como "Error al verificar la credencial"
        (verifyRegistrationResponse as jest.Mock).mockResolvedValue({
          verified: false,
          registrationInfo: null,
        });

        await expect(
          service.verifyRegistration('user-123', {
            credential: {
              id: 'test-id',
              rawId: 'test-raw-id',
              response: {
                clientDataJSON: 'test-data',
                attestationObject: 'test-object',
              },
              type: 'public-key',
            } as any,
            deviceName: 'Test',
          }),
        ).rejects.toThrow('Error al verificar la credencial');
      });
      it('debería lanzar BadRequestException si verifyRegistrationResponse lanza error', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue({
          ...mockUser,
          preferences: {
            currentChallenge: 'valid-challenge',
          },
        });
        
        // 👇 NUEVO TEST: Simular error en la verificación
        (verifyRegistrationResponse as jest.Mock).mockRejectedValue(
          new Error('Error interno de verificación')
        );

        await expect(
          service.verifyRegistration('user-123', {
            credential: {
              id: 'test',
              rawId: 'test',
              response: {
                clientDataJSON: 'data',
                attestationObject: 'obj',
              },
              type: 'public-key',
            } as any,
            deviceName: 'Test',
          }),
        ).rejects.toThrow(BadRequestException);
        
        await expect(
          service.verifyRegistration('user-123', {
            credential: {
              id: 'test',
              rawId: 'test',
              response: {
                clientDataJSON: 'data',
                attestationObject: 'obj',
              },
              type: 'public-key',
            } as any,
            deviceName: 'Test',
          }),
        ).rejects.toThrow('Error al verificar la credencial');
      });
    });
  });

  describe('WebAuthn - Autenticación', () => {
    describe('generateAuthenticationOptions', () => {
      it('debería generar opciones de autenticación exitosamente', async () => {
        const mockCredentials = [
          {
            credentialID: Buffer.from([1, 2, 3]),
            transports: ['usb', 'nfc'],
          },
        ];

        const mockOptions = {
          challenge: 'auth-challenge-123',
          allowCredentials: [
            {
              id: Buffer.from([1, 2, 3]),
              transports: ['usb', 'nfc'],
            },
          ],
        };

        mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
        mockPrismaService.authenticator.findMany.mockResolvedValue(mockCredentials);
        mockPrismaService.user.update.mockResolvedValue({
          ...mockUser,
          currentChallenge: 'auth-challenge-123',
        });
        (generateAuthenticationOptions as jest.Mock).mockResolvedValue(mockOptions);

        const result = await service.generateAuthenticationOptions('test@example.com');

        expect(result).toEqual(mockOptions);
        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { email: 'test@example.com' },
          include: { authenticators: true },
        });
      });

      it('debería lanzar NotFoundException si el usuario no existe', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue(null);

        await expect(
          service.generateAuthenticationOptions('nonexistent@example.com'),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('verifyAuthentication', () => {
      it('debería verificar autenticación exitosamente', async () => {
        const credential = {
          id: 'credential-id-123',
          rawId: 'credential-id-123',
          response: {
            clientDataJSON: 'client-data',
            authenticatorData: 'auth-data',
            signature: 'signature',
          },
          type: 'public-key',
        };

        const mockAuthenticator = {
          id: 'auth-123',
          credentialID: 'credential-id-123',
          credentialPublicKey: Buffer.from([4, 5, 6]),
          counter: BigInt(0),
        };

        const mockVerification = {
          verified: true,
          authenticationInfo: {
            newCounter: 1,
          },
        };

        const userWithAuth = {
          ...mockUser,
          preferences: { currentChallenge: 'valid-challenge' },
          authenticators: [mockAuthenticator],
        };

        mockPrismaService.user.findUnique.mockResolvedValue(userWithAuth);
        (verifyAuthenticationResponse as jest.Mock).mockResolvedValue(mockVerification);
        mockPrismaService.$transaction.mockImplementation(async (callback) => {
          return await callback({
            authenticator: {
              update: jest.fn().mockResolvedValue({}),
            },
            securityLog: {
              create: jest.fn().mockResolvedValue({}),
            },
            user: {
              update: jest.fn().mockResolvedValue(mockUser),
            },
          });
        });

        const result = await service.verifyAuthentication('test@example.com', credential);

        expect(result).toEqual(userWithAuth);
      });

      it('debería lanzar UnauthorizedException si el usuario no existe', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue(null);

        await expect(
          service.verifyAuthentication('nonexistent@example.com', {} as any),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('debería lanzar BadRequestException si no hay challenge', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

        await expect(
          service.verifyAuthentication('test@example.com', {} as any),
        ).rejects.toThrow(BadRequestException);
      });

      it('debería lanzar UnauthorizedException si la credencial no se encuentra', async () => {
        const userWithAuth = {
          ...mockUser,
          preferences: { currentChallenge: 'valid-challenge' },
          authenticators: [],
        };

        mockPrismaService.user.findUnique.mockResolvedValue(userWithAuth);

        await expect(
          service.verifyAuthentication('test@example.com', { id: 'unknown-cred' } as any),
        ).rejects.toThrow(UnauthorizedException);
      });
    });
  });

  describe('Reconocimiento Facial', () => {
    describe('registerFace', () => {
      it('debería registrar descriptor facial exitosamente', async () => {
        const registerDto = {
          descriptor: [0.1, 0.2, 0.3],
          label: 'Rostro principal',
        };

        const mockFaceDescriptor = {
          id: 'face-123',
          userId: 'user-123',
          descriptor: 'encrypted-data',
          label: 'Rostro principal',
          deviceInfo: null,
          createdAt: new Date(),
          lastUsedAt: null,
        };

        mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
        mockPrismaService.$transaction.mockImplementation(async (callback) => {
          return await callback({
            faceDescriptor: {
              create: jest.fn().mockResolvedValue(mockFaceDescriptor),
            },
            securityLog: {
              create: jest.fn().mockResolvedValue({}),
            },
          });
        });

        const result = await service.registerFace('user-123', registerDto);

        expect(result.id).toBe('face-123');
        expect(result.label).toBe('Rostro principal');
        expect(CryptoJS.AES.encrypt).toHaveBeenCalled();
      });

      it('debería lanzar NotFoundException si el usuario no existe', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue(null);

        await expect(
          service.registerFace('user-999', { descriptor: [], label: 'Test' }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('verifyFace', () => {
      it('debería verificar rostro exitosamente', async () => {
        const verifyDto = {
          email: 'test@example.com',
          descriptor: [0.1, 0.2, 0.3],
        };

        const userWithFace = {
          ...mockUser,
          faceDescriptors: [
            {
              id: 'face-123',
              descriptor: 'encrypted-data',
              label: 'Rostro principal',
            },
          ],
        };

        mockPrismaService.user.findUnique.mockResolvedValue(userWithFace);
        (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
          toString: jest.fn().mockReturnValue(JSON.stringify([0.1, 0.2, 0.3])),
        });
        mockPrismaService.$transaction.mockImplementation(async (callback) => {
          return await callback({
            faceDescriptor: {
              update: jest.fn().mockResolvedValue({}),
            },
            securityLog: {
              create: jest.fn().mockResolvedValue({}),
            },
          });
        });

        const result = await service.verifyFace(verifyDto);

        expect(result).toEqual(userWithFace);
      });

      it('debería lanzar UnauthorizedException si el usuario no existe', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue(null);

        await expect(
          service.verifyFace({ email: 'nonexistent@example.com', descriptor: [] }),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('debería lanzar BadRequestException si no hay descriptores registrados', async () => {
        const userWithoutFace = {
          ...mockUser,
          faceDescriptors: [],
        };

        mockPrismaService.user.findUnique.mockResolvedValue(userWithoutFace);

        await expect(
          service.verifyFace({ email: 'test@example.com', descriptor: [] }),
        ).rejects.toThrow(BadRequestException);
      });

      it('debería lanzar UnauthorizedException si el rostro no coincide', async () => {
        const userWithFace = {
          ...mockUser,
          faceDescriptors: [
            {
              id: 'face-123',
              descriptor: 'encrypted-data',
              label: 'Rostro principal',
            },
          ],
        };

        mockPrismaService.user.findUnique.mockResolvedValue(userWithFace);
        // Mock para que la distancia sea muy alta (rostro no coincide)
        (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
          toString: jest.fn().mockReturnValue(JSON.stringify([10, 20, 30])),
        });
        mockPrismaService.securityLog.create.mockResolvedValue({});

        await expect(
          service.verifyFace({ email: 'test@example.com', descriptor: [0.1, 0.1, 0.1] }),
        ).rejects.toThrow(UnauthorizedException);
      });
    });
  });

  describe('Gestión', () => {
    describe('getBiometricStatus', () => {
      it('debería obtener estado con métodos registrados', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue({
          ...mockUser,
          authenticators: [{ id: 'auth-1', deviceName: 'iPhone' }],
          faceDescriptors: [{ id: 'face-1', label: 'Principal' }],
        });

        const result = await service.getBiometricStatus('user-123');

        expect(result).toEqual({
          hasWebAuthn: true,
          hasFacial: true,
          webAuthnCount: 1,
          facialCount: 1,
          availableMethods: ['webauthn', 'facial'],
        });
      });

      it('debería obtener estado sin métodos registrados', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue({
          ...mockUser,
          authenticators: [],
          faceDescriptors: [],
        });

        const result = await service.getBiometricStatus('user-123');

        expect(result).toEqual({
          hasWebAuthn: false,
          hasFacial: false,
          webAuthnCount: 0,
          facialCount: 0,
          availableMethods: [],
        });
      });
    });

    describe('listWebAuthnCredentials', () => {
      it('debería listar credenciales WebAuthn', async () => {
        const mockAuthenticators = [
          {
            id: 'auth-1',
            credentialID: 'cred-id-1',
            deviceName: 'iPhone 15',
            credentialDeviceType: 'singleDevice',
            transports: ['usb'],
            createdAt: new Date(),
            lastUsedAt: null,
          },
        ];

        mockPrismaService.authenticator.findMany.mockResolvedValue(mockAuthenticators);

        const result = await service.listWebAuthnCredentials('user-123');

        expect(result).toHaveLength(1);
        expect(result[0].deviceName).toBe('iPhone 15');
      });
    });

    describe('listFaceDescriptors', () => {
      it('debería listar descriptores faciales', async () => {
        const mockDescriptors = [
          {
            id: 'face-1',
            label: 'Rostro principal',
            deviceInfo: 'iPhone',
            createdAt: new Date(),
            lastUsedAt: null,
          },
        ];

        mockPrismaService.faceDescriptor.findMany.mockResolvedValue(mockDescriptors);

        const result = await service.listFaceDescriptors('user-123');

        expect(result).toHaveLength(1);
        expect(result[0].label).toBe('Rostro principal');
      });
    });

    describe('deleteWebAuthnCredential', () => {
      it('debería eliminar credencial WebAuthn', async () => {
        mockPrismaService.authenticator.findFirst.mockResolvedValue({
          id: 'auth-1',
          userId: 'user-123',
        });
        mockPrismaService.authenticator.delete.mockResolvedValue({});

        const result = await service.deleteWebAuthnCredential('user-123', 'auth-1');

        expect(result.message).toBe('Credencial eliminada exitosamente');
      });

      it('debería lanzar NotFoundException si la credencial no existe', async () => {
        mockPrismaService.authenticator.findFirst.mockResolvedValue(null);

        await expect(
          service.deleteWebAuthnCredential('user-123', 'auth-999'),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('deleteFaceDescriptor', () => {
      it('debería eliminar descriptor facial', async () => {
        mockPrismaService.faceDescriptor.findFirst.mockResolvedValue({
          id: 'face-1',
          userId: 'user-123',
        });
        mockPrismaService.faceDescriptor.delete.mockResolvedValue({});

        const result = await service.deleteFaceDescriptor('user-123', 'face-1');

        expect(result.message).toBe('Descriptor eliminado exitosamente');
      });

      it('debería lanzar NotFoundException si el descriptor no existe', async () => {
        mockPrismaService.faceDescriptor.findFirst.mockResolvedValue(null);

        await expect(
          service.deleteFaceDescriptor('user-123', 'face-999'),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });
});