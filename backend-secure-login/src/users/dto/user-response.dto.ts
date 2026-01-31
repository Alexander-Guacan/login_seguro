import { Role } from '../../common/enums/role.enum';

export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  preferences?: any;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * UsersListResponseDto
 * 
 * DTO para respuesta de listado de usuarios (con paginación).
 */
export class UsersListResponseDto {
  users: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  constructor(partial: Partial<UsersListResponseDto>) {
    Object.assign(this, partial);
  }
}