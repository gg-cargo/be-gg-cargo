import { Controller, Post, Patch, Param, Body, UploadedFile, UseInterceptors, HttpException, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { join } from 'path';
import type { Express } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('file')
export class FileController {
    constructor(private readonly fileService: FileService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: 'public/uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, uniqueSuffix + extname(file.originalname));
            },
        }),
    }))
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Body('used_for') used_for: string, @Req() req: any) {
        if (!file) {
            throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
        }

        const userId = req.user?.id;
        return this.fileService.createFileLog(file, userId, used_for);
    }

    @Patch('assign/:id')
    async assignFile(@Param('id') id: number) {
        return this.fileService.assignFile(Number(id));
    }
} 