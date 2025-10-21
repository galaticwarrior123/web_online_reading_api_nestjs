import { IsString } from "class-validator";



export class CreateCategoryDto {
    @IsString()
    name: { vi: string; en: string };
}