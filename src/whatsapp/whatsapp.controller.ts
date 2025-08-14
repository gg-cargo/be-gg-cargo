import { Body, Controller, Get, Post, Query, UnauthorizedException, NotFoundException, RequestTimeoutException, ConflictException, InternalServerErrorException, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { SendTextDto, SendMediaDto, QrOptionsDto } from './dto';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly service: WhatsappService) { }

  @Get('health')
  async health() {
    try {
      return await this.service.getHealth();
    } catch (error) {
      throw this.handleWhatsAppError(error);
    }
  }

  @Get('status')
  async status() {
    try {
      return await this.service.getStatus();
    } catch (error) {
      throw this.handleWhatsAppError(error);
    }
  }

  @Get('qr')
  async getQrCode(@Query('type') type?: string) {
    try {
      const options: QrOptionsDto = type ? { type: type as any } : {};
      return await this.service.getQrCode(options);
    } catch (error) {
      throw this.handleWhatsAppError(error);
    }
  }

  @Post('refresh-qr')
  async refreshQrCode() {
    try {
      return await this.service.refreshQrCode();
    } catch (error) {
      throw this.handleWhatsAppError(error);
    }
  }

  @Post('force-init')
  async forceInit() {
    try {
      return await this.service.forceInit();
    } catch (error) {
      throw this.handleWhatsAppError(error);
    }
  }

  @Post('send-text')
  async sendText(@Body() body: SendTextDto) {
    try {
      const sendText = await this.service.sendText(body);
      return sendText;
    } catch (error) {
      throw this.handleWhatsAppError(error);
    }
  }

  @Post('send-media')
  async sendMedia(@Body() body: SendMediaDto) {
    try {
      return await this.service.sendMedia(body);
    } catch (error) {
      throw this.handleWhatsAppError(error);
    }
  }

  @Post('logout')
  async logout() {
    try {
      return await this.service.logout();
    } catch (error) {
      throw this.handleWhatsAppError(error);
    }
  }

  @Post('cleanup')
  async cleanup() {
    try {
      return await this.service.cleanup();
    } catch (error) {
      throw this.handleWhatsAppError(error);
    }
  }

  /**
   * Handle error dari WhatsApp service dan convert ke HTTP exception
   */
  private handleWhatsAppError(error: any): any {
    // Log error untuk debugging
    console.error('WhatsApp Controller Error:', error);

    // Convert error message ke HTTP exception yang sesuai
    const errorMessage = error.message || 'Unknown error';

    // Log original error message untuk debugging
    console.log('Original Error Message:', errorMessage);

    if (errorMessage.includes('Unauthorized')) {
      return new UnauthorizedException(errorMessage);
    } else if (errorMessage.includes('tidak ditemukan') || errorMessage.includes('tidak tersedia')) {
      return new NotFoundException(errorMessage);
    } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      return new RequestTimeoutException(errorMessage);
    } else if (errorMessage.includes('belum siap') || errorMessage.includes('Conflict')) {
      return new ConflictException(errorMessage);
    } else if (errorMessage.includes('Internal server error')) {
      return new InternalServerErrorException(errorMessage);
    } else if (errorMessage.includes('tidak dapat terhubung') || errorMessage.includes('Network error')) {
      return new ServiceUnavailableException(errorMessage);
    } else {
      return new BadRequestException(errorMessage);
    }
  }
}



