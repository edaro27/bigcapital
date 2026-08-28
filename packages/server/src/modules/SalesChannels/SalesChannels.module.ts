import { Module } from '@nestjs/common';
import { TenancyModule } from '@/modules/Tenancy/Tenancy.module';
import { SalesChannelsController } from './SalesChannels.controller';
import {
  SalesChannelsService,
  SalesChannelValidator,
} from './SalesChannels.service';
import { SalesByChannelReportController } from './SalesByChannelReport.controller';
import { SalesByChannelReportService } from './SalesByChannelReport.service';

@Module({
  imports: [TenancyModule],
  controllers: [SalesChannelsController, SalesByChannelReportController],
  providers: [
    SalesChannelsService,
    SalesChannelValidator,
    SalesByChannelReportService,
  ],
  exports: [SalesChannelsService, SalesChannelValidator],
})
export class SalesChannelsModule {}
