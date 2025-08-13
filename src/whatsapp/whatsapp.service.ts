import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';

interface SendTextDto {
  phoneNumber: string;
  message: string;
}

interface SendMediaDto {
  phoneNumber: string;
  caption?: string;
  fileUrl?: string;
  filePath?: string;
}

interface QrOptionsDto {
  type?: 'dataurl' | 'svg' | 'text';
}

@Injectable()
export class WhatsappService {
  private baseUrl: string;
  private apiKey?: string;
  private http: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('WWEB_BASE_URL', 'http://wweb:3001');
    this.apiKey = this.config.get<string>('WWEB_API_KEY');
    this.http = axios.create({
      baseURL: this.baseUrl,
      headers: this.apiKey ? { 'x-api-key': this.apiKey } : {},
      timeout: 15000,
    });
  }

  async getStatus() {
    const { data } = await this.http.get('/status');
    return data;
  }

  async getHealth() {
    const { data } = await this.http.get('/health');
    return data;
  }

  async getQrCode(options?: QrOptionsDto) {
    const params = options?.type ? { type: options.type } : {};
    const { data } = await this.http.get('/qr', { params });
    return data;
  }

  async refreshQrCode() {
    const { data } = await this.http.post('/refresh-qr');
    return data;
  }

  async forceInit() {
    const { data } = await this.http.post('/force-init');
    return data;
  }

  async sendText(dto: SendTextDto) {
    const { data } = await this.http.post('/send-text', dto);
    return data;
  }

  async sendMedia(dto: SendMediaDto) {
    const { data } = await this.http.post('/send-media', dto);
    return data;
  }

  async logout() {
    const { data } = await this.http.post('/logout');
    return data;
  }

  async cleanup() {
    const { data } = await this.http.post('/cleanup');
    return data;
  }
}
