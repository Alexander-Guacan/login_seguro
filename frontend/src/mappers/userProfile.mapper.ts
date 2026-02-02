import type { UserProfileRequestDTO } from "../dto/user";
import type { User } from "../models/user";

export const UserProfileMapper = {
  toDTO(user: User): UserProfileRequestDTO {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      preferences: user.preferences,
    };
  },
};
