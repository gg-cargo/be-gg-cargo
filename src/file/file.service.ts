import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { join } from 'path';
import { unlink } from 'fs/promises';
import { FileLog } from '../models/file-log.model';
import type { Express } from 'express';

@Injectable()
export class FileService {
    constructor(
        @InjectModel(FileLog)
        private fileLogModel: typeof FileLog,
    ) { }

    /**
     * Ubah URL/file_path tersimpan di DB menjadi path absolut di disk (public/uploads/...).
     */
    private localPathFromStoredFilePath(stored: string): string | null {
        if (!stored) return null;
        const normalized = stored.replace(/\\/g, '/');
        const uploadsIdx = normalized.indexOf('/uploads/');
        if (uploadsIdx !== -1) {
            const relativeAfterPublic = normalized.slice(uploadsIdx + 1);
            return join(process.cwd(), 'public', relativeAfterPublic);
        }
        return null;
    }

    private async deleteLocalFileIfExists(storedPath: string): Promise<void> {
        const local = this.localPathFromStoredFilePath(storedPath);
        if (!local) return;
        try {
            await unlink(local);
        } catch (e: any) {
            if (e?.code !== 'ENOENT') {
                console.warn(`Gagal menghapus file lama ${local}:`, e?.message || e);
            }
        }
    }

    private buildUploadResponse(
        id: number,
        file: Express.Multer.File,
        filePathUrl: string,
        used_for: string,
        is_assigned: number,
        message: string,
    ) {
        return {
            message,
            data: {
                id,
                file_name: file.originalname,
                file_path: filePathUrl,
                file_type: file.mimetype.split('/')[1],
                file_size: file.size,
                is_assigned,
                used_for,
            },
        };
    }

    /**
     * Simpan file baru ke file_log. Jika nama file asli sudah ada, timpa baris terbaru
     * (pertahankan id & is_assigned) dan hapus file fisik lama.
     */
    async upsertFileLogFromUpload(file: Express.Multer.File, user_id?: number, used_for?: string) {
        try {
            const filePathUrl = `https://api.99delivery.id/${file.path.replace('public/', '')}`;
            const fileType = file.mimetype.split('/')[1];
            const uid = typeof user_id === 'number' ? user_id : 0;
            const used = used_for ?? '';

            const existing = await this.fileLogModel.findOne({
                where: { file_name: file.originalname },
                order: [['id', 'DESC']],
            });

            if (existing) {
                const oldStoredPath = existing.getDataValue('file_path') as string;
                await this.deleteLocalFileIfExists(oldStoredPath);

                const prevAssigned = Number(existing.getDataValue('is_assigned')) === 1 ? 1 : 0;

                await existing.update({
                    user_id: uid,
                    file_path: filePathUrl,
                    file_type: fileType,
                    file_size: file.size,
                    used_for: used,
                    is_assigned: prevAssigned,
                    updated_at: new Date(),
                });

                return this.buildUploadResponse(
                    existing.getDataValue('id'),
                    file,
                    filePathUrl,
                    used,
                    prevAssigned,
                    'File berhasil diupload (mengganti unggahan sebelumnya dengan nama yang sama)',
                );
            }

            // @ts-ignore
            const created = await this.fileLogModel.create({
                user_id: uid,
                file_name: file.originalname,
                file_path: filePathUrl,
                file_type: fileType,
                file_size: file.size,
                is_assigned: 0,
                used_for: used,
            });
            return this.buildUploadResponse(
                created.id,
                file,
                filePathUrl,
                used,
                0,
                'File berhasil diupload',
            );
        } catch (err) {
            console.log(err);
            throw new HttpException('Gagal menyimpan file log', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createFileLog(file: Express.Multer.File, user_id?: number, used_for?: string) {
        try {
            // @ts-ignore
            const created = await this.fileLogModel.create({
                user_id: typeof user_id === 'number' ? user_id : 0,
                file_name: file.originalname,
                file_path: `https://api.99delivery.id/${file.path.replace('public/', '')}`,
                file_type: file.mimetype.split('/')[1],
                file_size: file.size,
                is_assigned: 0,
                used_for: used_for ?? '',
            });
            return this.buildUploadResponse(
                created.id,
                file,
                `https://api.99delivery.id/${file.path.replace('public/', '')}`,
                used_for ?? '',
                0,
                'File berhasil diupload',
            );
        } catch (err) {
            console.log(err);
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