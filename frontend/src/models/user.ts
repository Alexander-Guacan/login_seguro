import type { UserRole } from "../enums/userRole.enum";

export class User {
  constructor(
    public id: string,
    public email: string,
    public firstName: string,
    public lastName: string,
    public role: UserRole,
    public isActive: boolean,
    public createdAt: Date,
    public preferences?: string,
  ) {}
}
