import { IsString } from "class-validator";



export class CreateNewsDto {
    @IsString()
    title: string;
    @IsString()
    content: string;
    @IsString()
    summary: string;
    @IsString()
    author: string;
    @IsString()
    category: string;
    @IsString()
    featuredImage?: string;

}