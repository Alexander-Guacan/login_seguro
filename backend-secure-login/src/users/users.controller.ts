import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateProfileDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { User } from '@generated/prisma/client';

/**
 * Endpoints ADMIN (requieren rol ADMIN):
 * - POST /users - Crear usuario
 * - GET /users - Listar usuarios (con filtros y paginación)
 * - GET /users/:id - Obtener usuario por ID
 * - PATCH /users/:id - Actualizar usuario
 * - DELETE /users/:id - Eliminar usuario (soft delete)
 * 
 * Endpoints para cualquier usuario autenticado:
 * - GET /users/profile/me - Ver propio perfil
 * - PATCH /users/profile/me - Actualizar propio perfil
 * - PATCH /users/profile/change-password - Cambiar contraseña
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ========== ENDPOINTS ADMIN ==========

  /**
   * POST /users
   * 
   * Crea un nuevo usuario (solo ADMIN).
   * 
   * @param createUserDto - Datos del usuario a crear
   * @param currentUser - Usuario admin que crea
   * @param req - Request de Express
   * @returns Usuario creado
   */
  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: User,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    return this.usersService.create(
      createUserDto,
      currentUser.id,
      ipAddress,
      userAgent,
    );
  }

  /**
   * GET /users
   * 
   * Lista todos los usuarios con filtros y paginación (solo ADMIN).
   * 
   * Query params:
   * - search: Buscar por email, nombre o apellido
   * - role: Filtrar por rol (ADMIN o CLIENT)
   * - isActive: Filtrar por estado activo/inactivo
   * - page: Número de página (default: 1)
   * - limit: Usuarios por página (default: 10, max: 100)
   * - sortBy: Campo para ordenar (default: createdAt)
   * - sortOrder: Orden ascendente o descendente (default: desc)
   * 
   * @param query - Parámetros de búsqueda
   * @returns Lista paginada de usuarios
   */
  @Get()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  /**
   * GET /users/:id
   * 
   * Obtiene un usuario por ID (solo ADMIN).
   * 
   * @param id - ID del usuario
   * @returns Usuario encontrado
   */
  @Get(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * PATCH /users/:id
   * 
   * Actualiza un usuario (solo ADMIN).
   * 
   * @param id - ID del usuario a actualizar
   * @param updateUserDto - Datos a actualizar
   * @param currentUser - Usuario admin que actualiza
   * @param req - Request de Express
   * @returns Usuario actualizado
   */
  @Patch(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    return this.usersService.update(
      id,
      updateUserDto,
      currentUser.id,
      ipAddress,
      userAgent,
    );
  }

  /**
   * DELETE /users/:id
   * 
   * Elimina un usuario (soft delete - marca como inactivo) (solo ADMIN).
   * 
   * @param id - ID del usuario a eliminar
   * @param currentUser - Usuario admin que elimina
   * @param req - Request de Express
   * @returns Mensaje de confirmación
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    return this.usersService.remove(
      id,
      currentUser.id,
      ipAddress,
      userAgent,
    );
  }

  // ========== ENDPOINTS PERFIL (Todos los usuarios autenticados) ==========

  /**
   * GET /users/profile/me
   * 
   * Obtiene el perfil del usuario actual.
   * Cualquier usuario autenticado puede ver su propio perfil.
   * 
   * @param currentUser - Usuario actual
   * @returns Perfil del usuario
   */
  @Get('profile/me')
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() currentUser: User) {
    return this.usersService.findOne(currentUser.id);
  }

  /**
   * PATCH /users/profile/me
   * 
   * Actualiza el perfil del usuario actual.
   * Solo permite actualizar campos no sensibles (nombre, apellido, preferencias).
   * 
   * @param updateProfileDto - Datos a actualizar
   * @param currentUser - Usuario actual
   * @param req - Request de Express
   * @returns Perfil actualizado
   */
  @Patch('profile/me')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser() currentUser: User,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    return this.usersService.updateProfile(
      currentUser.id,
      updateProfileDto,
      ipAddress,
      userAgent,
    );
  }

  /**
   * PATCH /users/profile/change-password
   * 
   * Cambia la contraseña del usuario actual.
   * Requiere la contraseña actual para validar la identidad.
   * 
   * @param changePasswordDto - Contraseña actual y nueva
   * @param currentUser - Usuario actual
   * @param req - Request de Express
   * @returns Mensaje de confirmación
   */
  @Patch('profile/change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() currentUser: User,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    return this.usersService.changePassword(
      currentUser.id,
      changePasswordDto,
      ipAddress,
      userAgent,
    );
  }
}