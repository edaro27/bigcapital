import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContactAddressDto } from './ContactAddress.dto';
import {
  IsEmailList,
  IsOptional,
  NormalizeEmailList,
} from '@/common/decorators/Validators';

export class EditCustomerDto extends ContactAddressDto {
  @ApiProperty({ required: true, description: 'Customer type' })
  @IsString()
  @IsNotEmpty()
  customerType: string;

  @ApiProperty({ required: false, description: 'Salutation' })
  @IsOptional()
  @IsString()
  salutation?: string;

  @ApiProperty({ required: false, description: 'First name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false, description: 'Last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false, description: 'Company name' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ required: true, description: 'Display name' })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiProperty({ required: false, description: 'Website' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({
    required: false,
    description: 'Comma-separated customer email addresses',
  })
  @IsOptional()
  @NormalizeEmailList()
  @IsEmailList()
  email?: string;

  @ApiProperty({ required: false, description: 'Work phone' })
  @IsOptional()
  @IsString()
  workPhone?: string;

  @ApiProperty({ required: false, description: 'Personal phone' })
  @IsOptional()
  @IsString()
  personalPhone?: string;

  @ApiProperty({ required: false, description: 'Note' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ required: false, description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ required: false, description: 'Customer code' })
  @IsOptional()
  @IsString()
  code?: string;
}
