import { IsOptional, IsString } from "class-validator";
import { PaginationQueryParams } from "../../pagination/dto/pagination.dto";

export class GetEventsDTO extends PaginationQueryParams {
  @IsOptional()
  @IsString()
  search?: string;
}
