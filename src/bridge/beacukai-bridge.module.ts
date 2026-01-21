import { Module } from '@nestjs/common';
import { BeacukaiBridgeController } from '../bridge/beacukai-bridge.controller';
import { BeacukaiBridgeService } from '../bridge/beacukai-bridge.service';

@Module({
    controllers: [BeacukaiBridgeController],
    providers: [BeacukaiBridgeService],
})
export class BeacukaiBridgeModule { }
