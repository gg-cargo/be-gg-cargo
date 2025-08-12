import { Body, Controller, Get, Post } from '@nestjs/common';
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

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly service: WhatsappService) {}

  @Get('status')
  async status() {
    return this.service.getStatus();
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
}
