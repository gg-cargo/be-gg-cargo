import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OcrService } from './ocr.service';
import { OcrController } from './ocr.controller';

@Module({
    imports: [ConfigModule],
    controllers: [OcrController],
    providers: [OcrService],
    exports: [OcrService],
})
export class OcrModule { }


