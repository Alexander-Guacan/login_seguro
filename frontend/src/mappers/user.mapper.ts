import type { UserResponseDTO } from "../dto/user";
import { isUserRole } from "../enums/userRole.enum";
import { User } from "../models/user";
import { UserPreferencesMapper } from "./userPreferences.mapper";

export const UserMapper = {
  toEntity(dto: UserResponseDTO) {
    if (!isUserRole(dto.role)) {
      throw new Error("User role undefined");
    }

    return new User(
      dto.id,
      dto.email,
      dto.firstName,
      dto.lastName,
      dto.role,
      dto.isActive,
      new Date(dto.createdAt),
      dto.preferences
        ? UserPreferencesMapper.toEntity(dto.preferences)
        : undefined,
    );
  },
};
