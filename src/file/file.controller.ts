import { Controller, Post, Patch, Param, Body, UploadedFile, UseInterceptors, HttpException, HttpStatus, UseGuards, Req, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Express } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { promises as fsPromises } from 'fs';
import * as sharp from 'sharp';

@UseGuards(JwtAuthGuard)
@Controller('file')
export class FileController {
    private readonly logger = new Logger(FileController.name);

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

        const isDuplicate = await this.fileService.isFileNameExists(file.originalname);
        if (isDuplicate) {
            await this.removePhysicalFile(file.path);
            throw new HttpException('File dengan nama tersebut sudah pernah diupload', HttpStatus.CONFLICT);
        }

        await this.compressImageIfNeeded(file);

        const userId = req.user?.id;
        return this.fileService.createFileLog(file, userId, used_for);
    }

    @Patch('assign/:id')
    async assignFile(@Param('id') id: number) {
        return this.fileService.assignFile(Number(id));
    }

    private async compressImageIfNeeded(file: Express.Multer.File) {
        if (!file?.mimetype?.startsWith('image/') || !file?.path) return;

        const tempPath = `${file.path}.tmp`;

        try {
            const transformer = sharp(file.path).rotate();

            if (file.mimetype === 'image/png') {
                await transformer.png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(tempPath);
            } else if (file.mimetype === 'image/webp') {
                await transformer.webp({ quality: 80 }).toFile(tempPath);
            } else if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
                await transformer.jpeg({ quality: 75, mozjpeg: true }).toFile(tempPath);
            } else {
                // Format lain tidak dikompres
                return;
            }

            await fsPromises.rename(tempPath, file.path);
            const stats = await fsPromises.stat(file.path);
            file.size = stats.size;
        } catch (error: any) {
            await this.removePhysicalFile(tempPath);
            this.logger.warn(`Gagal mengompres file ${file.originalname}: ${error?.message || error}`);
        }
    }

    private async removePhysicalFile(filePath?: string) {
        if (!filePath) return;
        try {
            await fsPromises.unlink(filePath);
        } catch (error: any) {
            if (error?.code !== 'ENOENT') {
                this.logger.warn(`Gagal menghapus file ${filePath}: ${error?.message || error}`);
            }
        }
    }
} 