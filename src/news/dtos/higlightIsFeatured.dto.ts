import { IsBoolean } from "class-validator";



export class HighlightIsFeaturedDto {
    @IsBoolean()
    isFeatured: boolean;
}