export class BiometricCredential {
  public id: string;
  public credentialId: string;
  public deviceName: string;
  public credentialDeviceType: string;
  public transports: string[];
  public createdAt: Date;
  public lastUsedAt: Date;

  constructor({
    id,
    credentialId,
    deviceName,
    credentialDeviceType,
    transports,
    createdAt,
    lastUsedAt,
  }: {
    id: string;
    credentialId: string;
    deviceName: string;
    credentialDeviceType: string;
    transports: string[];
    createdAt: Date;
    lastUsedAt: Date;
  }) {
    this.id = id;
    this.credentialId = credentialId;
    this.deviceName = deviceName;
    this.credentialDeviceType = credentialDeviceType;
    this.transports = transports;
    this.createdAt = createdAt;
    this.lastUsedAt = lastUsedAt;
  }
}
