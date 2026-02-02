import type {
  UserPreferencesRequestDTO,
  UserPreferencesResponseDTO,
} from "../dto/user";
import {
  isUserPreferenceLanguage,
  isUserPreferenceTheme,
  UserPreferences,
} from "../models/userPreferences";

export const UserPreferencesMapper = {
  toEntity(dto: UserPreferencesResponseDTO) {
    if (!dto.theme || !isUserPreferenceTheme(dto.theme)) {
      throw new Error("Invalid UserPreference (theme)");
    }

    if (!dto.language || !isUserPreferenceLanguage(dto.language)) {
      throw new Error("Invalid UserPreference (language)");
    }

    return new UserPreferences(dto.theme, dto.language, !!dto?.notifications);
  },

  toDTO(preferences: UserPreferences): UserPreferencesRequestDTO {
    return {
      language: preferences.language,
      notifications: preferences.notifications,
      theme: preferences.theme,
    };
  },
};
