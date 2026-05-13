import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { CustomerCompaniesService } from './customer-companies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RegisterCustomerCompanyDto } from './dto/register-customer-company.dto';
import { AddCustomerCompanyDocumentDto } from './dto/add-customer-company-document.dto';

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
    @Post('me/documents')
    @HttpCode(HttpStatus.CREATED)
    async addMyCompanyDocument(@Req() req: any, @Body() dto: AddCustomerCompanyDocumentDto) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User tidak terautentikasi');
        }
        return this.customerCompaniesService.addMyCompanyDocument(userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.customerCompaniesService.findOne(id);
    }
}
