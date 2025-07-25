import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
    @Get()
    check() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'GG Kargo API',
            version: '1.0.0'
        };
    }
} 