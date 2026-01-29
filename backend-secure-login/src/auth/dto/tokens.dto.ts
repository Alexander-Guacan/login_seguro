import { IsString, IsNotEmpty } from 'class-validator';

export class TokensResponseDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

/**
 * RefreshTokenDto
 * 
 * DTO para solicitud de renovación de token.
 */
export class RefreshTokenDto {
  @IsString({ message: 'El refresh token debe ser un texto' })
  @IsNotEmpty({ message: 'El refresh token es requerido' })
  refreshToken: string;
}