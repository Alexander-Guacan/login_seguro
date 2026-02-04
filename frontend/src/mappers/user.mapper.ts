import type {
  UserUpdateRequestDTO,
  UserResponseDTO,
  UserRequestDTO,
} from "../dto/user";
import { isUserRole } from "../enums/userRole.enum";
import { User } from "../models/user";
import { UserPreferencesMapper } from "./userPreferences.mapper";

export const UserMapper = {
  toEntity(dto: UserResponseDTO) {
    if (!isUserRole(dto.role)) {
      throw new Error("User role undefined");
    }

    return new User({
      id: dto.id,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      isActive: dto.isActive,
      createdAt: new Date(dto.createdAt),
      preferences: dto.preferences
        ? UserPreferencesMapper.toEntity(dto.preferences)
        : undefined,
    });
  },

  toDTO(user: User, password: string): UserRequestDTO {
    return {
      email: user.email,
      firstName: user.firstName,
      isActive: user.isActive,
      lastName: user.lastName,
      role: user.role,
      password,
    };
  },

  toUpdateDTO(user: User, password?: string): UserUpdateRequestDTO {
    const dto: UserUpdateRequestDTO = {
      email: user.email,
      firstName: user.firstName,
      isActive: user.isActive,
      lastName: user.lastName,
      role: user.role,
    };

    if (password) {
      dto.password = password;
    }

    return dto;
  },
};
