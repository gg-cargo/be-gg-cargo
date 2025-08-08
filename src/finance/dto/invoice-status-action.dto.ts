import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum InvoiceStatusAction {
    GENERATE = 'generate',
    SUBMIT = 'submit',
    REVERT_TO_DRAFT = 'revert_to_draft',
    UPDATE_UNPAID = 'update_unpaid'
}

export class InvoiceStatusActionDto {
    @IsString({ message: 'Status action harus berupa string' })
    @IsNotEmpty({ message: 'Status action wajib diisi' })
    @IsEnum(InvoiceStatusAction, { message: 'Status action tidak valid' })
    status_action: InvoiceStatusAction;

    @IsNumber()
    @Type(() => Number)
    updated_by_user_id: number;
} 