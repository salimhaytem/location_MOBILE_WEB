import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get(':id/invoice')
  async generateInvoice(@Param('id') id: string) {
    return this.invoicesService.generateInvoice(id);
  }
}