import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Query,
    Param,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { BarangService } from './barang.service';
import { CreateBarangDto } from './dto/create-barang.dto';
import { UpdateBarangDto } from './dto/update-barang.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('barang')
export class BarangController {
    constructor(private readonly barangService: BarangService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateBarangDto) {
        return this.barangService.create(dto);
    }

    @Get()
    async findAll(@Query('search') search?: string) {
        return this.barangService.findAll(search);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.barangService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateBarangDto,
    ) {
        return this.barangService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.barangService.remove(id);
    }
}
