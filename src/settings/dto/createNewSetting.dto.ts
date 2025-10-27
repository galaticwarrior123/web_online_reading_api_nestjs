import { IsOptional, IsString } from "class-validator";



export class CreateNewSettingsDto {
    @IsString()
    @IsOptional()
    logo: string;

    @IsString()
    @IsOptional()
    iconLogo: string;

    @IsString()
    @IsOptional()
    nameWebsite: string;

    @IsString()
    @IsOptional()
    descriptionWebsite: string;

    @IsString()
    @IsOptional()
    emailWebsite: string;

    @IsString()
    @IsOptional()
    phoneWebsite: string;
}