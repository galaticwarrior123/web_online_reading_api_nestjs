import { IsIn, IsString } from "class-validator";



export class UpdateStatusDto {
    @IsString()
    id: string;
    @IsIn(['draft', 'pending', 'published', 'rejected'])
    status: 'draft' | 'pending' | 'published' | 'rejected';
    @IsString()
    approvedBy?: string;
    @IsString()
    reason?: string;

}