import { IsNotEmpty, IsString, IsArray, IsOptional, IsNumber, ArrayMinSize } from 'class-validator';

/**
 * RegisterFaceDto
 * 
 * DTO para registrar descriptores faciales.
 * El descriptor es un array de 128 números que representa el rostro matemáticamente.
 */
export class RegisterFaceDto {
  @IsArray()
  @ArrayMinSize(128)
  @IsNumber({}, { each: true })
  descriptor: number[]; // Descriptor facial de Face-API.js

  @IsOptional()
  @IsString()
  label?: string; // Etiqueta descriptiva (ej: "Mi laptop")

  @IsOptional()
  @IsString()
  deviceInfo?: string;
}

/**
 * VerifyFaceDto
 * 
 * DTO para verificar reconocimiento facial en el login.
 */
export class VerifyFaceDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsArray()
  @ArrayMinSize(128)
  @IsNumber({}, { each: true })
  descriptor: number[]; // Descriptor facial capturado en el login
}

/**
 * FaceDescriptorResponseDto
 * 
 * DTO para respuesta con información de descriptores faciales registrados.
 */
export class FaceDescriptorResponseDto {
  id: string;
  label?: string;
  deviceInfo?: string;
  createdAt: Date;
  lastUsedAt: Date;
}