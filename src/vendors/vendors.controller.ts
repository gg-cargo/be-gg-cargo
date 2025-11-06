import {
    Controller,
    Post,
    Get,
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
}

