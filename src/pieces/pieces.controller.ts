import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeliveryNotesService } from '../delivery-notes/delivery-notes.service';
import { ScanPieceDto, ScanPieceResponseDto } from '../delivery-notes/dto/scan-piece.dto';

@Controller('pieces')
export class PiecesController {
    constructor(private readonly deliveryNotesService: DeliveryNotesService) { }

    @UseGuards(JwtAuthGuard)
    @Post(':piece_id/scan')
    async scanPiece(
        @Param('piece_id') pieceId: string,
        @Body() body: ScanPieceDto,
    ): Promise<ScanPieceResponseDto> {
        return this.deliveryNotesService.scanPiece(pieceId, body);
    }
}

