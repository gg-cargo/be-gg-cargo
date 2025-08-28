import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeliveryNotesService } from './delivery-notes.service';
import { CreateDeliveryNoteDto, CreateDeliveryNoteResponseDto } from './dto/create-delivery-note.dto';
import { ListDeliveryNotesQueryDto, ListDeliveryNotesResponseDto } from './dto/list-delivery-notes.dto';
import { DeliveryNoteDetailResponseDto } from './dto/delivery-note-detail.dto';

@Controller('delivery-notes')
export class DeliveryNotesController {
    constructor(private readonly deliveryNotesService: DeliveryNotesService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createDeliveryNote(
        @Body() body: CreateDeliveryNoteDto,
        @Request() req: any,
    ): Promise<{ message: string; data: CreateDeliveryNoteResponseDto }> {
        const userId = req.user?.id;
        const result = await this.deliveryNotesService.createDeliveryNote(body, userId);
        return {
            message: 'Delivery note berhasil dibuat',
            data: result,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get(':no_delivery_note/pdf')
    async getDeliveryNotePdf(@Param('no_delivery_note') noDeliveryNote: string): Promise<{ message: string; data: any }> {
        const result = await this.deliveryNotesService.generatePdf(noDeliveryNote);
        return {
            message: 'Berhasil menghasilkan tautan PDF',
            data: result,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async listDeliveryNotes(
        @Query() query: ListDeliveryNotesQueryDto,
        @Request() req: any,
    ): Promise<{ message: string; data: ListDeliveryNotesResponseDto }> {
        // Ambil user ID dari request
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User tidak terautentikasi');
        }

        const result = await this.deliveryNotesService.listDeliveryNotes(query, userId);
        return {
            message: 'Berhasil mengambil daftar delivery note',
            data: result,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getDeliveryNoteDetail(@Param('id') id: string): Promise<{ message: string; data: DeliveryNoteDetailResponseDto }> {
        const result = await this.deliveryNotesService.getDeliveryNoteDetail(id);
        return {
            message: 'Berhasil mengambil detail delivery note',
            data: result,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async updateDeliveryNote(
        @Param('id') id: string,
        @Body() body: CreateDeliveryNoteDto,
        @Request() req: any,
    ): Promise<{ message: string; data: any }> {
        const userId = req.user?.id;
        const result = await this.deliveryNotesService.updateDeliveryNote(id, body, userId);
        return {
            message: 'Delivery note berhasil diperbarui',
            data: result,
        };
    }
}
