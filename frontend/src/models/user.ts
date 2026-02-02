import { getRoleName, type UserRole } from "../enums/userRole.enum";
import { capitalize } from "../utils/text.util";

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

  get fullName() {
    return capitalize(this.firstName) + " " + capitalize(this.lastName);
  }

  get roleName() {
    return getRoleName(this.role);
  }
}
