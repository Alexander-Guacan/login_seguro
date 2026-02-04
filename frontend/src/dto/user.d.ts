export interface UserPreferencesResponseDTO {
  theme?: string;
  language?: string;
  notifications?: boolean;
}

export interface UserResponseDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  preferences?: UserPreferencesResponseDTO;
}

export interface UserListResponseDTO {
  users: UserResponseDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserPreferencesRequestDTO {
  theme?: string;
  language?: string;
  notifications?: boolean;
}

export interface UserProfileRequestDTO {
  firstName?: string;
  lastName?: string;
  preferences?: UserPreferencesRequestDTO;
}

export interface ChangePasswordRequestDTO {
  currentPassword: string;
  newPassword: string;
}

export interface UserUpdateRequestDTO {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
}

export interface UserRequestDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: strign;
  role: string;
  isActive: boolean;
}
