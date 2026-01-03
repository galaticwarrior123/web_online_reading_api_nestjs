import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { NewsRevisionService } from './news-revision.service';

@Controller('api/news-revision')
export class NewsRevisionController {
    constructor(
        private readonly newsRevisionService: NewsRevisionService,
    ) { }

    @Get('/all')
    async getAllNewsRevision(@Query('page') page: number, @Query('limit') limit: number) {
        return this.newsRevisionService.getAllNewsRevision(page, limit);
    }

    @Get('/news/:newsId')
    async getNewsRevisionByNewsId(@Param('newsId') newsId: string, @Query('page') page: number, @Query('limit') limit: number) {
        return this.newsRevisionService.getNewsRevisionByNewsId(newsId, page, limit);
    }

    @Put('/update-status/:id')
    async updateStatusNewsRevision(@Param('id') id: string, @Body() data: any) {
        return this.newsRevisionService.updateStatusNewsRevision(id, data.status);
    }

    @Put('/approve/:id')
    async approveNewsRevision(@Param('id') id: string) {
        return this.newsRevisionService.approveNewsRevision(id);
    }

}
