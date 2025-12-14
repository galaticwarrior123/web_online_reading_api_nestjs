import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ImageService } from './image.service';
import { RequestImageTraningDto } from './dtos/requestImageTraningDto.dto';
import { UpdateImageStatusDto } from './dtos/updateImageStatusDto.dto';

@Controller('/api/image-training')
export class ImageController {
    constructor(private readonly imageService: ImageService) {}

    @Get('pending-images')
    async getImagesPendingTraining() {
        return this.imageService.getImagesPendingTraining();
    }

    
    @Post('request-training')
    async requestImageTraining(@Body() requestDto: RequestImageTraningDto) {
        return this.imageService.requestImageTraining(requestDto);
    }

    @Put('update-status/:id')
    async updateImageStatus(@Param('id') id: string, @Body()updateImageStatusDto: UpdateImageStatusDto) {
        return this.imageService.updateImageStatus(id, updateImageStatusDto);
    }

}
