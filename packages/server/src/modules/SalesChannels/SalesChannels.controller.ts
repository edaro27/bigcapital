import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { AuthorizationGuard } from '@/modules/Roles/Authorization.guard';
import { PermissionGuard } from '@/modules/Roles/Permission.guard';
import { RequirePermission } from '@/modules/Roles/RequirePermission.decorator';
import { AbilitySubject } from '@/modules/Roles/Roles.types';
import { SaleInvoiceAction } from '@/modules/SaleInvoices/SaleInvoice.types';
import {
  CreateSalesChannelDto,
  EditSalesChannelDto,
  SalesChannelResponseDto,
} from './dtos/SalesChannel.dto';
import { SalesChannelsService } from './SalesChannels.service';

@Controller('sales-channels')
@ApiTags('Sales Channels')
@ApiCommonHeaders()
@ApiExtraModels(SalesChannelResponseDto)
@UseGuards(AuthorizationGuard, PermissionGuard)
export class SalesChannelsController {
  constructor(private readonly salesChannels: SalesChannelsService) {}

  @Get()
  @RequirePermission(SaleInvoiceAction.View, AbilitySubject.SaleInvoice)
  @ApiOperation({ summary: 'List sales channels.' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [SalesChannelResponseDto] })
  public list(@Query('includeInactive') includeInactive?: string) {
    return this.salesChannels.list(includeInactive === 'true');
  }

  @Post()
  @RequirePermission(SaleInvoiceAction.Edit, AbilitySubject.SaleInvoice)
  @ApiOperation({ summary: 'Create a sales channel.' })
  @ApiResponse({ status: 201, type: SalesChannelResponseDto })
  public create(@Body() dto: CreateSalesChannelDto) {
    return this.salesChannels.create(dto);
  }

  @Put(':id')
  @RequirePermission(SaleInvoiceAction.Edit, AbilitySubject.SaleInvoice)
  @ApiOperation({ summary: 'Edit a sales channel.' })
  @ApiResponse({ status: 200, type: SalesChannelResponseDto })
  public edit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditSalesChannelDto,
  ) {
    return this.salesChannels.edit(id, dto);
  }

  @Put(':id/archive')
  @RequirePermission(SaleInvoiceAction.Edit, AbilitySubject.SaleInvoice)
  @ApiOperation({ summary: 'Archive a sales channel.' })
  @ApiResponse({ status: 200, type: SalesChannelResponseDto })
  public archive(@Param('id', ParseIntPipe) id: number) {
    return this.salesChannels.setActive(id, false);
  }

  @Put(':id/restore')
  @RequirePermission(SaleInvoiceAction.Edit, AbilitySubject.SaleInvoice)
  @ApiOperation({ summary: 'Restore an archived sales channel.' })
  @ApiResponse({ status: 200, type: SalesChannelResponseDto })
  public restore(@Param('id', ParseIntPipe) id: number) {
    return this.salesChannels.setActive(id, true);
  }
}
