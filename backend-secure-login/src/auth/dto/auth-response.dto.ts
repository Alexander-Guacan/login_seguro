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
}


export class AuthResponseDto {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}