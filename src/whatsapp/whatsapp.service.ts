import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import { SendTextDto, SendMediaDto, QrOptionsDto } from './dto';

@Injectable()
export class WhatsappService {
  private baseUrl: string;
  private apiKey?: string;
  private http: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('WWEB_BASE_URL', 'https://sedekahku.99delivery.id');
    this.apiKey = this.config.get<string>('WWEB_API_KEY');
    this.http = axios.create({
      baseURL: this.baseUrl,
      headers: this.apiKey ? { 'x-api-key': this.apiKey } : {},
      timeout: 15000,
    });
  }

  async getStatus() {
    try {
      const { data } = await this.http.get('/status');
      return data;
    } catch (error) {
      this.handleError('getStatus', error);
    }
  }

  async getHealth() {
    try {
      const { data } = await this.http.get('/health');
      return data;
    } catch (error) {
      this.handleError('getHealth', error);
    }
  }

  async getQrCode(options?: QrOptionsDto) {
    try {
      const params = options?.type ? { type: options.type } : {};
      const { data } = await this.http.get('/qr', { params });
      return data;
    } catch (error) {
      this.handleError('getQrCode', error);
    }
  }

  async refreshQrCode() {
    try {
      const { data } = await this.http.post('/refresh-qr');
      return data;
    } catch (error) {
      this.handleError('refreshQrCode', error);
    }
  }

  async forceInit() {
    try {
      const { data } = await this.http.post('/force-init');
      return data;
    } catch (error) {
      this.handleError('forceInit', error);
    }
  }

  async sendText(dto: SendTextDto) {
    try {
      const { data } = await this.http.post('/send-text', dto);
      return data;
    } catch (error) {
      this.handleError('sendText', error);
    }
  }

  async sendMedia(dto: SendMediaDto) {
    try {
      const { data } = await this.http.post('/send-media', dto);
      return data;
    } catch (error) {
      this.handleError('sendMedia', error);
    }
  }

  async logout() {
    try {
      const { data } = await this.http.post('/logout');
      return data;
    } catch (error) {
      this.handleError('logout', error);
    }
  }

  async cleanup() {
    try {
      const { data } = await this.http.post('/cleanup');
      return data;
    } catch (error) {
      this.handleError('cleanup', error);
    }
  }

  /**
   * Handle error dari HTTP request ke wweb service
   */
  private handleError(method: string, error: any): never {
    // Log error untuk debugging
    console.error(`WhatsApp Service Error [${method}]:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });

    // Handle berbagai jenis error
    if (error.response) {
      // Server responded dengan error status
      const { status, data } = error.response;

      // Prioritaskan pesan error dari API wweb service
      const apiErrorMessage = data?.error || data?.message || data?.status_message;
      const hasApiError = apiErrorMessage && apiErrorMessage !== 'Unknown error';

      switch (status) {
        case 401:
          if (hasApiError) {
            throw new Error(`Unauthorized: ${apiErrorMessage}`);
          }
          throw new Error('Unauthorized: API key tidak valid atau tidak dikirim');

        case 404:
          if (method === 'getQrCode' && hasApiError) {
            throw new Error(`QR code tidak tersedia: ${apiErrorMessage}`);
          } else if (hasApiError) {
            throw new Error(`Resource tidak ditemukan: ${apiErrorMessage}`);
          }
          throw new Error('Resource tidak ditemukan');

        case 408:
          if (method === 'refreshQrCode' && hasApiError) {
            throw new Error(`Timeout menunggu QR code: ${apiErrorMessage}`);
          } else if (hasApiError) {
            throw new Error(`Request timeout: ${apiErrorMessage}`);
          }
          throw new Error('Request timeout');

        case 409:
          if ((method === 'sendText' || method === 'sendMedia') && hasApiError) {
            throw new Error(`WhatsApp belum siap: ${apiErrorMessage}`);
          } else if (hasApiError) {
            throw new Error(`Conflict: ${apiErrorMessage}`);
          }
          throw new Error('Conflict: Resource sedang dalam state yang tidak sesuai');

        case 500:
          if (hasApiError) {
            throw new Error(`Internal server error dari wweb service: ${apiErrorMessage}`);
          }
          throw new Error('Internal server error dari wweb service: Unknown error');

        default:
          if (hasApiError) {
            throw new Error(`HTTP Error ${status}: ${apiErrorMessage}`);
          }
          throw new Error(`HTTP Error ${status}: ${error.message}`);
      }
    } else if (error.request) {
      // Request dibuat tapi tidak ada response
      throw new Error('Tidak dapat terhubung ke wweb service. Pastikan service berjalan.');
    } else {
      // Error lain (network, timeout, dll)
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Koneksi ditolak. Pastikan wweb service berjalan di port yang benar.');
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('Host tidak ditemukan. Periksa konfigurasi WWEB_BASE_URL.');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('Request timeout. Periksa koneksi jaringan atau wweb service.');
      } else {
        throw new Error(`Network error: ${error.message}`);
      }
    }
  }
}
