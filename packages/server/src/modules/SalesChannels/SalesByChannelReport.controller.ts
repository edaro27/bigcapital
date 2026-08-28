import {
  Controller,
  Get,
  Headers,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AcceptType } from '@/constants/accept-type';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { AuthorizationGuard } from '@/modules/Roles/Authorization.guard';
import { PermissionGuard } from '@/modules/Roles/Permission.guard';
import { RequirePermission } from '@/modules/Roles/RequirePermission.decorator';
import { AbilitySubject } from '@/modules/Roles/Roles.types';
import { SaleInvoiceAction } from '@/modules/SaleInvoices/SaleInvoice.types';
import {
  SalesByChannelQueryDto,
  SalesByChannelReportResponseDto,
} from './dtos/SalesByChannelReport.dto';
import { SalesByChannelReportService } from './SalesByChannelReport.service';

@Controller('/reports/sales-by-channel')
@ApiTags('Reports')
@ApiCommonHeaders()
@ApiExtraModels(SalesByChannelReportResponseDto)
@UseGuards(AuthorizationGuard, PermissionGuard)
export class SalesByChannelReportController {
  constructor(private readonly reportService: SalesByChannelReportService) {}

  @Get()
  @RequirePermission(SaleInvoiceAction.View, AbilitySubject.SaleInvoice)
  @ApiOperation({ summary: 'Sales totals grouped by internal sales channel.' })
  @ApiResponse({ status: 200, type: SalesByChannelReportResponseDto })
  public async report(
    @Query() query: SalesByChannelQueryDto,
    @Headers('accept') acceptHeader: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const accept = acceptHeader ?? '';

    if (accept.includes(AcceptType.ApplicationCsv)) {
      const output = await this.reportService.export(
        query,
        AcceptType.ApplicationCsv,
      );
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=sales_by_channel.csv',
      );
      response.setHeader('Content-Type', 'text/csv');
      response.send(output);
      return;
    }
    if (accept.includes(AcceptType.ApplicationXlsx)) {
      const output = await this.reportService.export(
        query,
        AcceptType.ApplicationXlsx,
      );
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=sales_by_channel.xlsx',
      );
      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      response.send(output);
      return;
    }
    return this.reportService.report(query);
  }
}
