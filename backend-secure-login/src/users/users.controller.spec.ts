// Mock modules BEFORE imports
jest.mock('@generated/prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

jest.mock('../prisma/prisma.service');

import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateProfileDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
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

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
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
    preferences: { theme: 'light', language: 'es' },
  };

  const mockAdmin: User = {
    ...mockUser,
    id: 'admin-123',
    email: 'admin@example.com',
    role: Role.ADMIN,
  };

  const mockUserResponse = {
    id: mockUser.id,
    email: mockUser.email,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    role: mockUser.role,
    isActive: mockUser.isActive,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
    preferences: mockUser.preferences,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  // ==================== ENDPOINTS ADMIN ====================

  describe('POST /users (crear)', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      firstName: 'Jane',
      lastName: 'Smith',
      role: Role.CLIENT,
      isActive: true,
    };

    it('debería crear un nuevo usuario exitosamente', async () => {
      mockUsersService.create.mockResolvedValue(mockUserResponse);

      const result = await controller.create(createUserDto, mockAdmin, mockRequest);

      expect(result).toEqual(mockUserResponse);
      expect(usersService.create).toHaveBeenCalledWith(
        createUserDto,
        'admin-123',
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('debería manejar la falta de IP y user-agent', async () => {
      const emptyReq = {
        ip: undefined,
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as Request;
      mockUsersService.create.mockResolvedValue(mockUserResponse);

      await controller.create(createUserDto, mockAdmin, emptyReq);

      expect(usersService.create).toHaveBeenCalledWith(
        createUserDto,
        'admin-123',
        'unknown',
        'unknown',
      );
    });
  });

  describe('GET /users (listar todos)', () => {
    const queryDto: QueryUsersDto = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    const mockUsersListResponse = {
      users: [mockUserResponse],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    it('debería retornar una lista paginada de usuarios', async () => {
      mockUsersService.findAll.mockResolvedValue(mockUsersListResponse);

      const result = await controller.findAll(queryDto);

      expect(result).toEqual(mockUsersListResponse);
      expect(usersService.findAll).toHaveBeenCalledWith(queryDto);
    });

    it('debería filtrar por término de búsqueda', async () => {
      const searchQuery = { ...queryDto, search: 'john' };
      mockUsersService.findAll.mockResolvedValue(mockUsersListResponse);

      await controller.findAll(searchQuery);

      expect(usersService.findAll).toHaveBeenCalledWith(searchQuery);
    });

    it('debería filtrar por rol', async () => {
      const roleQuery = { ...queryDto, role: Role.CLIENT };
      mockUsersService.findAll.mockResolvedValue(mockUsersListResponse);

      await controller.findAll(roleQuery);

      expect(usersService.findAll).toHaveBeenCalledWith(roleQuery);
    });

    it('debería filtrar por estado activo', async () => {
      const activeQuery = { ...queryDto, isActive: true };
      mockUsersService.findAll.mockResolvedValue(mockUsersListResponse);

      await controller.findAll(activeQuery);

      expect(usersService.findAll).toHaveBeenCalledWith(activeQuery);
    });
  });

  describe('GET /users/:id (obtener uno)', () => {
    it('debería retornar un usuario por id', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUserResponse);

      const result = await controller.findOne('user-123');

      expect(result).toEqual(mockUserResponse);
      expect(usersService.findOne).toHaveBeenCalledWith('user-123');
    });
  });

  describe('PATCH /users/:id (actualizar)', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
      isActive: false,
    };

    it('debería actualizar un usuario exitosamente', async () => {
      const updatedUser = { ...mockUserResponse, ...updateUserDto };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(
        'user-123',
        updateUserDto,
        mockAdmin,
        mockRequest,
      );

      expect(result).toEqual(updatedUser);
      expect(usersService.update).toHaveBeenCalledWith(
        'user-123',
        updateUserDto,
        'admin-123',
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('debería manejar la falta de IP y user-agent', async () => {
      const emptyReq = {
        ip: undefined,
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as Request;
      mockUsersService.update.mockResolvedValue(mockUserResponse);

      await controller.update('user-123', updateUserDto, mockAdmin, emptyReq);

      expect(usersService.update).toHaveBeenCalledWith(
        'user-123',
        updateUserDto,
        'admin-123',
        'unknown',
        'unknown',
      );
    });
  });

  describe('DELETE /users/:id (eliminar)', () => {
    it('debería eliminar (soft delete) un usuario exitosamente', async () => {
      const deleteResponse = { message: 'Usuario eliminado correctamente' };
      mockUsersService.remove.mockResolvedValue(deleteResponse);

      const result = await controller.remove('user-123', mockAdmin, mockRequest);

      expect(result).toEqual(deleteResponse);
      expect(usersService.remove).toHaveBeenCalledWith(
        'user-123',
        'admin-123',
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('debería manejar la falta de IP y user-agent', async () => {
      const emptyReq = {
        ip: undefined,
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as Request;
      mockUsersService.remove.mockResolvedValue({ message: 'Usuario eliminado' });

      await controller.remove('user-123', mockAdmin, emptyReq);

      expect(usersService.remove).toHaveBeenCalledWith(
        'user-123',
        'admin-123',
        'unknown',
        'unknown',
      );
    });
  });

  // ==================== ENDPOINTS DE PERFIL ====================

  describe('GET /users/profile/me (obtener perfil)', () => {
    it('debería retornar el perfil del usuario actual', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUserResponse);

      const result = await controller.getProfile(mockUser);

      expect(result).toEqual(mockUserResponse);
      expect(usersService.findOne).toHaveBeenCalledWith('user-123');
    });
  });

  describe('PATCH /users/profile/me (actualizar perfil)', () => {
    const updateProfileDto: UpdateProfileDto = {
      firstName: 'Updated',
      lastName: 'Name',
      preferences: { theme: 'dark', language: 'en' },
    };

    it('debería actualizar el perfil del usuario exitosamente', async () => {
      const updatedProfile = { ...mockUserResponse, ...updateProfileDto };
      mockUsersService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(
        updateProfileDto,
        mockUser,
        mockRequest,
      );

      expect(result).toEqual(updatedProfile);
      expect(usersService.updateProfile).toHaveBeenCalledWith(
        'user-123',
        updateProfileDto,
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('debería manejar la falta de IP y user-agent', async () => {
      const emptyReq = {
        ip: undefined,
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as Request;
      mockUsersService.updateProfile.mockResolvedValue(mockUserResponse);

      await controller.updateProfile(updateProfileDto, mockUser, emptyReq);

      expect(usersService.updateProfile).toHaveBeenCalledWith(
        'user-123',
        updateProfileDto,
        'unknown',
        'unknown',
      );
    });
  });

  describe('PATCH /users/profile/change-password (cambiar contraseña)', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass456!',
    };

    it('debería cambiar la contraseña exitosamente', async () => {
      const response = { message: 'Contraseña actualizada correctamente' };
      mockUsersService.changePassword.mockResolvedValue(response);

      const result = await controller.changePassword(
        changePasswordDto,
        mockUser,
        mockRequest,
      );

      expect(result).toEqual(response);
      expect(usersService.changePassword).toHaveBeenCalledWith(
        'user-123',
        changePasswordDto,
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('debería manejar la falta de IP y user-agent', async () => {
      const emptyReq = {
        ip: undefined,
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as Request;
      mockUsersService.changePassword.mockResolvedValue({ message: 'Success' });

      await controller.changePassword(changePasswordDto, mockUser, emptyReq);

      expect(usersService.changePassword).toHaveBeenCalledWith(
        'user-123',
        changePasswordDto,
        'unknown',
        'unknown',
      );
    });
  });
});
