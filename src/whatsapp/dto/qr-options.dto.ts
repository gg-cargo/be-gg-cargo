import { IsOptional, IsIn } from 'class-validator';

export class QrOptionsDto {
    @IsOptional()
    @IsIn(['dataurl', 'svg', 'text'])
    type?: 'dataurl' | 'svg' | 'text';
}
