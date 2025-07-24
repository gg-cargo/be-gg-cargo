import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FileLog } from '../models/file-log.model';
import type { File } from 'multer';

@Injectable()
export class FileService {
    constructor(
        @InjectModel(FileLog)
        private fileLogModel: typeof FileLog,
    ) { }

    async createFileLog(file: File, user_id?: number, used_for?: string) {
        try {
            // @ts-ignore
            const created = await this.fileLogModel.create({
                user_id: typeof user_id === 'number' ? user_id : 0,
                file_name: file.originalname,
                file_path: `https://api.99delivery.id/${file.path}`,
                file_type: file.mimetype.split('/')[1],
                file_size: file.size,
                is_assigned: 0,
                used_for: used_for ?? '',
            });
            return {
                message: 'File berhasil diupload',
                data: {
                    file_name: file.originalname,
                    file_path: `https://api.99delivery.id/${file.path}`,
                    file_type: file.mimetype.split('/')[1],
                    file_size: file.size,
                    is_assigned: 0,
                    used_for: used_for ?? '',
                },
            };
        } catch (err) {
            throw new HttpException('Gagal menyimpan file log', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async assignFile(id: number) {
        const [affectedCount] = await this.fileLogModel.update(
            { is_assigned: 1 },
            { where: { id } }
        );

        if (affectedCount === 0) {
            throw new HttpException('File log tidak ditemukan', HttpStatus.NOT_FOUND);
        }

        return {
            message: 'File berhasil diassign',
            data: {
                is_assigned: 1,
            },
        };
    }
} 