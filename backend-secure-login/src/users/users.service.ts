import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateProfileDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserResponseDto, UsersListResponseDto } from './dto/user-response.dto';
import { User } from '@generated/prisma/client';
import { Role } from '../common/enums/role.enum';


@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly SALT_ROUNDS = 12;

  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo usuario (solo ADMIN).
   * 
   * @param createUserDto - Datos del usuario a crear
   * @param adminId - ID del admin que crea el usuario
   * @param ipAddress - IP del cliente
   * @param userAgent - User agent
   * @returns Usuario creado
   */
  async create(
    createUserDto: CreateUserDto,
    adminId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<UserResponseDto> {
    const { email, password, firstName, lastName, role, isActive } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Crear usuario y log en una transacción
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role,
          isActive: isActive ?? true,
          preferences: {
            theme: 'light',
            language: 'es',
            notifications: true,
          },
        },
      });

      // Log de seguridad
      await tx.securityLog.create({
        data: {
          userId: adminId,
          action: 'USER_CREATED_BY_ADMIN',
          ipAddress,
          userAgent,
          metadata: {
            createdUserId: newUser.id,
            createdUserEmail: newUser.email,
            createdUserRole: newUser.role,
          },
        },
      });

      return newUser;
    });

    this.logger.log(`Usuario creado por admin: ${user.email}`);

    return this.sanitizeUser(user);
  }

  /**
   * Lista todos los usuarios con filtros y paginación (solo ADMIN).
   * 
   * @param query - Parámetros de búsqueda y paginación
   * @returns Lista paginada de usuarios
   */
  async findAll(query: QueryUsersDto): Promise<UsersListResponseDto> {
    const { search, role, isActive, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    // Construir condiciones de búsqueda
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Calcular skip y take para paginación
    const skip = (page - 1) * limit;

    // Ejecutar query con count en paralelo
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          preferences: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return new UsersListResponseDto({
      users: users.map(user => new UserResponseDto({ ...user, role: user.role as Role })),
      total,
      page,
      limit,
      totalPages,
    });
  }

  /**
   * Busca un usuario por ID.
   * 
   * @param id - ID del usuario
   * @returns Usuario encontrado
   */
  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        preferences: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return new UserResponseDto({ ...user, role: user.role as Role });
  }

  /**
   * Actualiza un usuario (solo ADMIN).
   * 
   * @param id - ID del usuario a actualizar
   * @param updateUserDto - Datos a actualizar
   * @param adminId - ID del admin que actualiza
   * @param ipAddress - IP del cliente
   * @param userAgent - User agent
   * @returns Usuario actualizado
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    adminId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<UserResponseDto> {
    // Verificar que el usuario existe
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Si se actualiza el email, verificar que no exista
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('El email ya está en uso');
      }
    }

    // Preparar datos de actualización
    const updateData: any = { ...updateUserDto };

    // Si se actualiza la contraseña, hashearla
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, this.SALT_ROUNDS);
    }

    // Actualizar usuario y crear log
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: updateData,
      });

      // Log de seguridad
      await tx.securityLog.create({
        data: {
          userId: adminId,
          action: 'USER_UPDATED_BY_ADMIN',
          ipAddress,
          userAgent,
          metadata: {
            updatedUserId: id,
            updatedFields: Object.keys(updateUserDto),
          },
        },
      });

      return updated;
    });

    this.logger.log(`Usuario actualizado por admin: ${updatedUser.email}`);

    return this.sanitizeUser(updatedUser);
  }

  /**
   * Elimina un usuario (soft delete - marca como inactivo).
   * 
   * @param id - ID del usuario a eliminar
   * @param adminId - ID del admin que elimina
   * @param ipAddress - IP del cliente
   * @param userAgent - User agent
   * @returns Mensaje de confirmación
   */
  async remove(
    id: string,
    adminId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<{ message: string }> {
    // Verificar que el usuario existe
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Prevenir que un admin se elimine a sí mismo
    if (id === adminId) {
      throw new BadRequestException('No puedes eliminar tu propia cuenta');
    }

    // Soft delete (marcar como inactivo)
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { isActive: false },
      });

      // Log de seguridad
      await tx.securityLog.create({
        data: {
          userId: adminId,
          action: 'USER_DELETED_BY_ADMIN',
          ipAddress,
          userAgent,
          metadata: {
            deletedUserId: id,
            deletedUserEmail: user.email,
          },
        },
      });
    });

    this.logger.log(`Usuario eliminado por admin: ${user.email}`);

    return { message: 'Usuario eliminado exitosamente' };
  }

  /**
   * Actualiza el perfil del usuario actual (CLIENT o ADMIN sobre sí mismo).
   * 
   * @param userId - ID del usuario que actualiza su perfil
   * @param updateProfileDto - Datos a actualizar
   * @param ipAddress - IP del cliente
   * @param userAgent - User agent
   * @returns Usuario actualizado
   */
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Actualizar perfil y crear log
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: updateProfileDto,
      });

      // Log de seguridad
      await tx.securityLog.create({
        data: {
          userId,
          action: 'PROFILE_UPDATED',
          ipAddress,
          userAgent,
          metadata: {
            updatedFields: Object.keys(updateProfileDto),
          },
        },
      });

      return updated;
    });

    this.logger.log(`Perfil actualizado: ${updatedUser.email}`);

    return this.sanitizeUser(updatedUser);
  }

  /**
   * Cambia la contraseña del usuario actual.
   * 
   * @param userId - ID del usuario
   * @param changePasswordDto - Contraseña actual y nueva
   * @param ipAddress - IP del cliente
   * @param userAgent - User agent
   * @returns Mensaje de confirmación
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    // Buscar usuario
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Actualizar contraseña y crear log
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      // Log de seguridad
      await tx.securityLog.create({
        data: {
          userId,
          action: 'PASSWORD_CHANGED',
          ipAddress,
          userAgent,
        },
      });
    });

    this.logger.log(`Contraseña cambiada: ${user.email}`);

    return { message: 'Contraseña actualizada exitosamente' };
  }

  /**
   * Sanitiza el usuario removiendo información sensible.
   */
  private sanitizeUser(user: User): UserResponseDto {
    const { password, ...sanitized } = user;
    return new UserResponseDto({ ...sanitized, role: sanitized.role as Role });
  }
}