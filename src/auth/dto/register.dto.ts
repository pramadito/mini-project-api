import { IsEmail, IsNotEmpty, IsString, IsIn } from "class-validator";

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

  @IsString()
  referredBy?: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['CUSTOMER', 'ORGANIZER', 'ADMIN'], { 
    message: 'Role must be one of: CUSTOMER, ORGANIZER, ADMIN' 
  })
  role!: 'CUSTOMER' | 'ORGANIZER' | 'ADMIN';

  @IsString()
  referralCode?: string;
}