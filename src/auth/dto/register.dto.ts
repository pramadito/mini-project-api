import { IsEmail, IsNotEmpty, IsString, IsIn, IsOptional } from "class-validator";

export class RegisterDTO {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  referredBy?: string;
}