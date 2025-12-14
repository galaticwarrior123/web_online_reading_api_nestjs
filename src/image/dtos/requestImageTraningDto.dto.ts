import { IsOptional, IsString } from "class-validator"



export class RequestImageTraningDto {
    @IsString({ each: true })
    listImage: any[];
    
    @IsString()
    senderId: string;
    
    @IsOptional()
    roleReceiver: 'admin' | 'user';

    @IsString()
    newsId: string;
    
}
