import { IsEmail,  IsString, IsOptional, MinLength, MaxLength } from "class-validator";

export class UpdateUserDTO {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;
}