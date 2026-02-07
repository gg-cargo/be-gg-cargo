import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    HttpStatus,
    HttpException,
    Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { TariffsService } from './tariffs.service';
import { BulkCreateTariffDto } from './dto/bulk-create-tariff.dto';
import { GetTariffsFilterDto } from './dto/get-tariffs-filter.dto';
import { UpdateTariffStatusDto } from './dto/update-tariff-status.dto';
import { SimulateTariffDto } from './dto/simulate-tariff.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

@Controller('master/tariffs')
export class TariffsController {
    constructor(private readonly tariffsService: TariffsService) { }

    @Get()
    async findAll(@Query() filterDto: GetTariffsFilterDto) {
        const result = await this.tariffsService.findAll(filterDto);
        return { success: true, message: 'Tariffs retrieved successfully', ...result };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.tariffsService.findOne(id);
        return { success: true, message: 'Tariff details retrieved successfully', data: result };
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/status')
    async updateStatus(@Param('id') id: string, @Body() dto: UpdateTariffStatusDto) {
        const result = await this.tariffsService.updateStatus(id, dto);
        return { success: true, message: 'Tariff status updated successfully', data: result };
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/duplicate')
    async duplicate(@Param('id') id: string) {
        const result = await this.tariffsService.duplicate(id);
        return { success: true, message: 'Tariff duplicated successfully', data: result };
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.tariffsService.remove(id);
        return { success: true, message: 'Tariff deleted successfully' };
    }

    @UseGuards(JwtAuthGuard)
    @Post('bulk-create')
    async bulkCreate(@Body() dto: BulkCreateTariffDto) {
        try {
            const result = await this.tariffsService.bulkCreate(dto);
            return {
                success: true,
                message: 'Bulk tariffs created successfully',
                data: result,
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: error.message || 'Failed to create bulk tariffs',
                    errors: error.response?.errors || null,
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('parse-excel')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: os.tmpdir(),
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `tariff-${uniqueSuffix}${path.extname(file.originalname)}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    file.mimetype === 'application/vnd.ms-excel') {
                    cb(null, true);
                } else {
                    cb(new Error('Only Excel files are allowed'), false);
                }
            },
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
        }),
    )
    async parseExcel(@UploadedFile() file: Express.Multer.File) {
        try {
            if (!file) {
                throw new HttpException(
                    {
                        success: false,
                        message: 'No file uploaded',
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }

            const result = await this.tariffsService.parseExcel(file.path);

            return {
                success: true,
                message: 'Excel file parsed successfully',
                data: result,
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: error.message || 'Failed to parse Excel file',
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('simulate')
    async simulate(@Body() dto: SimulateTariffDto) {
        try {
            const result = await this.tariffsService.simulate(dto);
            return {
                success: true,
                message: 'Price simulation completed successfully',
                data: result,
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: error.message || 'Failed to simulate price',
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('download-template')
    async downloadTemplate(@Res() res: Response) {
        try {
            // Create workbook
            const wb = XLSX.utils.book_new();

            // Create headers and example data
            const headers = ['Origin', 'Destination', 'Pricing Model', 'Base Rate', 'Min Charge'];
            const examples = [
                ['Jakarta (JKT)', 'Bandung (BDG)', 'Weight Based', 8000, 50000],
                ['Jakarta (JKT)', 'Surabaya (SBY)', 'Weight Based', 10000, 75000],
                ['Jakarta (JKT)', 'Bandung (BDG)', 'Route Based', 750000, 0],
                ['Jakarta (JKT)', 'Jakarta (JKT)', 'Distance Based', 5500, 1000000],
            ];

            const data = [headers, ...examples];

            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet(data);

            // Set column widths
            ws['!cols'] = [
                { wch: 20 }, // Origin
                { wch: 20 }, // Destination
                { wch: 18 }, // Pricing Model
                { wch: 12 }, // Base Rate
                { wch: 12 }, // Min Charge
            ];

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Tariff Import');

            // Generate buffer
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            // Set headers
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Tariff_Bulk_Import_Template.xlsx');

            // Send file
            res.send(buffer);
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to generate template',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
