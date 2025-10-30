import { Controller, Post, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrService } from './ocr.service';
import { Express } from 'express';

@Controller('ocr')
export class OcrController {
    constructor(private readonly ocrService: OcrService) { }

    @Post('ktp-scan')
    @UseInterceptors(FileInterceptor('file')) // 'file' is the field name for the uploaded file
    async scanKtp(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
        }
        try {
            const { data } = await this.ocrService.extractKtpData(file);
            return {
                status: 'success',
                message: 'Data KTP berhasil diekstrak.',
                data,
            };
        } catch (error) {
            throw new HttpException(
                error.message || 'Gagal mengekstrak data KTP',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}


