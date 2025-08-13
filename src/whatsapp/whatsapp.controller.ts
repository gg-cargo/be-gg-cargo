import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

class SendTextBodyDto {
  phoneNumber!: string;
  message!: string;
}

class SendMediaBodyDto {
  phoneNumber!: string;
  caption?: string;
  fileUrl?: string;
  filePath?: string;
}

class QrOptionsDto {
  type?: 'dataurl' | 'svg' | 'text';
}

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly service: WhatsappService) { }

  @Get('health')
  async health() {
    return this.service.getHealth();
  }

  @Get('status')
  async status() {
    return this.service.getStatus();
  }

  @Get('qr')
  async getQrCode(@Query('type') type?: string) {
    const options: QrOptionsDto = type ? { type: type as any } : {};
    return this.service.getQrCode(options);
  }

  @Post('refresh-qr')
  async refreshQrCode() {
    return this.service.refreshQrCode();
  }

  @Post('force-init')
  async forceInit() {
    return this.service.forceInit();
  }

  @Post('send-text')
  async sendText(@Body() body: SendTextBodyDto) {
    return this.service.sendText(body);
  }

  @Post('send-media')
  async sendMedia(@Body() body: SendMediaBodyDto) {
    return this.service.sendMedia(body);
  }

  @Post('logout')
  async logout() {
    return this.service.logout();
  }

  @Post('cleanup')
  async cleanup() {
    return this.service.cleanup();
  }
}



