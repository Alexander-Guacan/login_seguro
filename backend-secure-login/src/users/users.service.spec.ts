// Mock modules BEFORE imports
jest.mock('@generated/prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

jest.mock('../prisma/prisma.service');
jest.mock('bcrypt');

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateProfileDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { QueryUsersDto } from './dto/query-users.dto';

enum Role {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
}

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    securityLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockUser = {
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      firstName: 'Jane',
      lastName: 'Smith',
      role: Role.CLIENT,
      isActive: true,
    };

    it('should create a new user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          user: {
            create: jest.fn().mockResolvedValue(mockUser),
          },
          securityLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.create(
        createUserDto,
        'admin-123',
        '192.168.1.1',
        'Mozilla/5.0',
      );

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
      expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123!', 12);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.create(createUserDto, 'admin-123', '192.168.1.1', 'Mozilla/5.0'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    const queryDto: QueryUsersDto = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    it('should return paginated list of users', async () => {
      const users = [mockUser];
      mockPrismaService.user.findMany.mockResolvedValue(users);
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.findAll(queryDto);

      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(prismaService.user.findMany).toHaveBeenCalled();
      expect(prismaService.user.count).toHaveBeenCalled();
    });

    it('should filter by search term', async () => {
      const searchQuery = { ...queryDto, search: 'john' };
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);
      mockPrismaService.user.count.mockResolvedValue(1);

      await service.findAll(searchQuery);

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it('should filter by role', async () => {
      const roleQuery = { ...queryDto, role: Role.CLIENT };
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);
      mockPrismaService.user.count.mockResolvedValue(1);

      await service.findAll(roleQuery);

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: Role.CLIENT,
          }),
        }),
      );
    });

    it('should filter by active status', async () => {
      const activeQuery = { ...queryDto, isActive: true };
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);
      mockPrismaService.user.count.mockResolvedValue(1);

      await service.findAll(activeQuery);

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        }),
      );
    });

    it('should calculate correct pagination', async () => {
      const paginationQuery = { ...queryDto, page: 2, limit: 5 };
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(15);

      const result = await service.findAll(paginationQuery);

      expect(result.totalPages).toBe(3);
      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('user-123');

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update a user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          user: {
            update: jest.fn().mockResolvedValue(updatedUser),
          },
          securityLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.update(
        'user-123',
        updateUserDto,
        'admin-123',
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update(
          'non-existent',
          updateUserDto,
          'admin-123',
          '192.168.1.1',
          'Mozilla/5.0',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if email already in use', async () => {
      const updateWithEmail: UpdateUserDto = { email: 'existing@example.com' };
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, id: 'other-user' });

      await expect(
        service.update(
          'user-123',
          updateWithEmail,
          'admin-123',
          '192.168.1.1',
          'Mozilla/5.0',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password if provided', async () => {
      const updateWithPassword: UpdateUserDto = { password: 'NewPass123!' };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          user: {
            update: jest.fn().mockResolvedValue(mockUser),
          },
          securityLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      await service.update(
        'user-123',
        updateWithPassword,
        'admin-123',
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass123!', 12);
    });
  });

  describe('remove', () => {
    it('should soft delete a user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          user: {
            update: jest.fn().mockResolvedValue({ ...mockUser, isActive: false }),
          },
          securityLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.remove(
        'user-123',
        'admin-123',
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(result.message).toBe('Usuario eliminado exitosamente');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('non-existent', 'admin-123', '192.168.1.1', 'Mozilla/5.0'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if admin tries to delete themselves', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.remove('user-123', 'user-123', '192.168.1.1', 'Mozilla/5.0'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateProfile', () => {
    const updateProfileDto: UpdateProfileDto = {
      firstName: 'Updated',
      preferences: { theme: 'dark' },
    };

    it('should update user profile successfully', async () => {
      const updatedUser = { ...mockUser, ...updateProfileDto };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          user: {
            update: jest.fn().mockResolvedValue(updatedUser),
          },
          securityLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.updateProfile(
        'user-123',
        updateProfileDto,
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(result.firstName).toBe('Updated');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile(
          'non-existent',
          updateProfileDto,
          '192.168.1.1',
          'Mozilla/5.0',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass456!',
    };

    it('should change password successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true) // currentPassword is valid
        .mockResolvedValueOnce(false); // newPassword is different
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          user: {
            update: jest.fn().mockResolvedValue(mockUser),
          },
          securityLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.changePassword(
        'user-123',
        changePasswordDto,
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(result.message).toBe('Contraseña actualizada exitosamente');
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass456!', 12);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword(
          'non-existent',
          changePasswordDto,
          '192.168.1.1',
          'Mozilla/5.0',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if current password is incorrect', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(
          'user-123',
          changePasswordDto,
          '192.168.1.1',
          'Mozilla/5.0',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if new password is same as current', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true) // currentPassword is valid
        .mockResolvedValueOnce(true); // newPassword is same

      await expect(
        service.changePassword(
          'user-123',
          changePasswordDto,
          '192.168.1.1',
          'Mozilla/5.0',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
