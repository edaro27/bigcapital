import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ToNumber } from '@/common/decorators/Validators';

export class CreateSalesChannelDto {
  @ApiProperty({ example: 'E-commerce', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class EditSalesChannelDto extends PartialType(CreateSalesChannelDto) {}

export class SalesChannelResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'E-commerce' })
  name: string;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}
