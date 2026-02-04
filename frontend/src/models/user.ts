import { getRoleName, type UserRole } from "../enums/userRole.enum";
import { capitalize } from "../utils/text.util";
import { UserPreferences } from "./userPreferences";

export class User {
  public id: string;
  public email: string;
  public firstName: string;
  public lastName: string;
  public role: UserRole;
  public isActive: boolean;
  public createdAt: Date;
  public preferences?: UserPreferences;

  constructor({
    id,
    email,
    firstName,
    lastName,
    role,
    isActive,
    createdAt,
    preferences,
  }: {
    id?: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    createdAt?: Date;
    preferences?: UserPreferences;
  }) {
    this.id = id ?? "";
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.role = role;
    this.isActive = isActive;
    this.createdAt = createdAt ?? new Date();
    this.preferences = preferences;
  }

  get fullName() {
    return capitalize(this.firstName) + " " + capitalize(this.lastName);
  }

  get roleName() {
    return getRoleName(this.role);
  }
}
