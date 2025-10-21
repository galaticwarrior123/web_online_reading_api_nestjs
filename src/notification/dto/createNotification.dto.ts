import { IsOptional, IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateNotificationDto {
    @IsString()
    title: string;

    @IsString()
    sender: string;

    @IsOptional()
    @IsString()
    receiver?: string; // Có thể trống nếu gửi theo role

    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    role?: ("editor" | "chief_editor")[]; // ✅ Mảng role

    @IsOptional()
    @IsString()
    articleId?: string;
}