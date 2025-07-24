import { IsEmail, IsNotEmpty, IsString } from "class-validator";

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

  // @IsNotEmpty()
  // @IsString()
  // confirmPassword!: string;

  @IsString()
  referredBy?: string;
}
