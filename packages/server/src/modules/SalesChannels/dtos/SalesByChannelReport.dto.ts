import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional as IsOptionalValue,
  ToNumber,
} from '@/common/decorators/Validators';
import { parseBoolean } from '@/utils/parse-boolean';

export class SalesByChannelQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description:
      'Include draft invoices. Delivered invoices are used by default.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => parseBoolean(value, false))
  includeDrafts?: boolean;

  @ApiPropertyOptional({
    description: 'Limit the report to one sales channel.',
  })
  @IsOptionalValue()
  @ToNumber()
  @IsInt()
  salesChannelId?: number | null;
}

export class SalesByChannelRowDto {
  @ApiProperty({ nullable: true, example: 1 })
  salesChannelId: number | null;

  @ApiProperty({ example: 'E-commerce' })
  name: string;

  @ApiProperty({ example: false })
  archived: boolean;

  @ApiProperty({ example: 12 })
  invoiceCount: number;

  @ApiProperty({ example: 1200.0 })
  subtotal: number;

  @ApiProperty({ example: 50.0 })
  discounts: number;

  @ApiProperty({ example: 92.0 })
  tax: number;

  @ApiProperty({ example: 1242.0 })
  total: number;

  @ApiProperty({ example: 1000.0 })
  paid: number;

  @ApiProperty({ example: 242.0 })
  due: number;
}

export class SalesByChannelReportMetaDto {
  @ApiProperty({ example: 'USD' })
  baseCurrency: string;

  @ApiProperty({ example: 'Sales by Channel' })
  sheetName: string;
}

export class SalesByChannelReportResponseDto {
  @ApiProperty({ type: [SalesByChannelRowDto] })
  data: SalesByChannelRowDto[];

  @ApiProperty({ type: SalesByChannelRowDto })
  total: SalesByChannelRowDto;

  @ApiProperty({ type: SalesByChannelQueryDto })
  query: SalesByChannelQueryDto;

  @ApiProperty({ type: SalesByChannelReportMetaDto })
  meta: SalesByChannelReportMetaDto;
}
