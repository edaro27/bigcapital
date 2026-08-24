import {
  IsInt,
  IsIn,
  IsOptional,
  IsArray,
  ValidateNested,
  IsString,
  IsNumber,
  IsPositive,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ToNumber } from '@/common/decorators/Validators';
import { LandedCostTransactionType } from '../types/BillLandedCosts.types';

export class AllocateBillLandedCostItemDto {
  @IsInt()
  @ToNumber()
  entryId: number;

  @IsNumber()
  @IsPositive()
  @ToNumber()
  cost: number;
}

export class AllocateBillLandedCostDto {
  @IsInt()
  @ToNumber()
  transactionId: number;

  @IsIn(['Expense', 'Bill'])
  transactionType: LandedCostTransactionType;

  @IsInt()
  @ToNumber()
  transactionEntryId: number;

  @IsIn(['value', 'quantity'])
  allocationMethod: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AllocateBillLandedCostItemDto)
  items: AllocateBillLandedCostItemDto[];
}
