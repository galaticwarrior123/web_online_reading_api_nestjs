import { IsString } from "class-validator";



export class CommentCreateDto {
    @IsString()
    content: string;
    @IsString()
    news: string;
    @IsString()
    user: string;
    @IsString()
    parentComment?: string;
}


