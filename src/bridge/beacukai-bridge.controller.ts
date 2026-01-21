import { Body, Controller, Headers, HttpStatus, Post, Res, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { BeacukaiBridgeService } from '../bridge/beacukai-bridge.service';
import { BeacukaiKirimDto } from '../bridge/dto/beacukai-kirim.dto';
import { BeacukaiResponDto } from '../bridge/dto/beacukai-respon.dto';

@Controller('bridge/beacukai')
export class BeacukaiBridgeController {
    constructor(private readonly beacukaiBridgeService: BeacukaiBridgeService) { }

    @Post('kirim')
    async kirim(
        @Headers('x-bridge-key') bridgeKey: string | undefined,
        @Body() body: BeacukaiKirimDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{ code: number; data?: string; message?: string }> {
        const startedAt = Date.now();
        try {
            this.ensureBridgeKey(bridgeKey);
            const data = await this.beacukaiBridgeService.kirim(body.xml);
            this.beacukaiBridgeService.logBridgeCall('kirim', 'success', startedAt);
            return { code: 200, data };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                this.beacukaiBridgeService.logBridgeCall('kirim', 'unauthorized', startedAt, error);
                throw error;
            }
            this.beacukaiBridgeService.logBridgeCall('kirim', 'fail', startedAt, error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            return { code: 500, message: error?.message || 'Internal Server Error' };
        }
    }

    @Post('respon')
    async respon(
        @Headers('x-bridge-key') bridgeKey: string | undefined,
        @Body() body: BeacukaiResponDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{ code: number; data?: string; message?: string }> {
        const startedAt = Date.now();
        try {
            this.ensureBridgeKey(bridgeKey);
            const data = await this.beacukaiBridgeService.respon(body.no_barang, body.tgl_house_blawb);
            this.beacukaiBridgeService.logBridgeCall('respon', 'success', startedAt);
            return { code: 200, data };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                this.beacukaiBridgeService.logBridgeCall('respon', 'unauthorized', startedAt, error);
                throw error;
            }
            this.beacukaiBridgeService.logBridgeCall('respon', 'fail', startedAt, error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            return { code: 500, message: error?.message || 'Internal Server Error' };
        }
    }

    private ensureBridgeKey(bridgeKey: string | undefined): void {
        const expectedKey = process.env.BRIDGE_KEY;
        if (!expectedKey || !bridgeKey || bridgeKey !== expectedKey) {
            throw new UnauthorizedException('Unauthorized');
        }
    }
}
