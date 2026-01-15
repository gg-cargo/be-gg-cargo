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
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { CreateVendorResponseDto } from './dto/create-vendor-response.dto';
import { ListVendorsQueryDto, ListVendorsResponseDto } from './dto/list-vendors.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('vendors')
export class VendorsController {
    constructor(private readonly vendorsService: VendorsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createVendor(
        @Body() createVendorDto: CreateVendorDto,
    ): Promise<CreateVendorResponseDto> {
        return this.vendorsService.createVendor(createVendorDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async listVendors(
        @Query() query: ListVendorsQueryDto,
    ): Promise<ListVendorsResponseDto> {
        return this.vendorsService.listVendors(query);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getVendorById(
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.vendorsService.getVendorById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/approve')
    async approveVendor(
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.vendorsService.approveVendor(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    async updateVendor(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateVendorDto,
    ) {
        return this.vendorsService.updateVendor(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async deleteVendor(
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.vendorsService.deleteVendor(id);
    }
}

