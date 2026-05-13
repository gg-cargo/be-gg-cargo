import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { CustomerCompaniesService } from './customer-companies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RegisterCustomerCompanyDto } from './dto/register-customer-company.dto';

@Controller('customer-companies')
export class CustomerCompaniesController {
    constructor(private readonly customerCompaniesService: CustomerCompaniesService) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() dto: RegisterCustomerCompanyDto) {
        return this.customerCompaniesService.register(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('summary')
    async getSummary() {
        return this.customerCompaniesService.getSummary();
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll() {
        return this.customerCompaniesService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.customerCompaniesService.findOne(id);
    }
}
