import { IsOptional, IsString } from "class-validator";




export class UpdateImageStatusDto {
    @IsString()
    status: 'pending' | 'trained' | 'rejected';


    @IsString()
    @IsOptional()
    rejectReason?: string;
}