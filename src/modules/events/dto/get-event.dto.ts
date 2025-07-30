import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsDate,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl
} from 'class-validator';

export class getEventDTO {
  @IsInt()
  id!: number;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  location!: string;

  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @IsDate()
  @Type(() => Date)
  endDate!: Date;

  @IsInt()
  organizerId!: number;

  @IsInt()
  totalSeats!: number;

  @IsInt()
  availableSeats!: number;

  @IsNumber()
  price!: number;

  @IsString()
  category!: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsBoolean()
  isPublished!: boolean;

  @IsDate()
  @Type(() => Date)
  createdAt!: Date;

  @IsDate()
  @Type(() => Date)
  updatedAt!: Date;
}
