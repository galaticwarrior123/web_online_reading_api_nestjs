import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dtos/createNews.dto';
import { UpdateStatusDto } from './dtos/updateStatus.dto';
import { HighlightIsFeaturedDto } from './dtos/higlightIsFeatured.dto';
import { PutPriorityDto } from './dtos/putPriority.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('api/news')
export class NewsController {
    constructor(private newsService: NewsService) { }
    @Get('all')
    async getAllNews() {
        return this.newsService.getAllNews();
    }

    @Get('search')
    async getArticlesBySearch(@Query('keySearch') q: string) {
        return this.newsService.getArticlesBySearch(q);
    }

    @Get('slug/:slug')
    async getNewsBySlug(@Param('slug') slug: string) {
        return this.newsService.findBySlug(slug);
    }

    @Get('featured')
    async getFeaturedArticles(@Query('limit') limit: number) {
        return this.newsService.getFeaturedNews(limit);
    }

    @Put('view/:slug')
    async incrementNewsViews(@Param('slug') slug: string) {
        await this.newsService.incrementViews(slug);
        return { message: 'View count incremented' };
    }

    @Get('top-viewed')
    async getTopViewedArticles(@Query('limit') limit: number, @Query('category') category: string, @Query('slug') slug: string) {
        return this.newsService.getTopViewedArticles(limit, category, slug);
    }

    @Get('latest-articles')
    async getLastedArticles(@Query('limit') limit: number, @Query('slug') slug: string) {
        return this.newsService.getLastedArticles(limit, slug);

    }

    @Post('create')
    @UseGuards(AuthGuard)
    async(@Body() newsData: CreateNewsDto) {
        return this.newsService.create(newsData);
    }


    @Get(':id')
    async getNewsById(@Param('id') id: string) {
        return this.newsService.findById(id);
    }

    @Get('author/:authorId')
    async getNewsByAuthor(@Param('authorId') authorId: string) {
        return this.newsService.getNewsByAuthor(authorId);
    }


    @Put('update/:id')
    async updateNews(@Param('id') id: string, @Body() updateData: Partial<CreateNewsDto>) {
        return this.newsService.updateNews(id, updateData);
    }

    @Put('status')
    async updateStatus(@Body() updateStatusDto: UpdateStatusDto) {
        return this.newsService.updateStatus(updateStatusDto);
    }

    @Delete(":id")
    async deleteNews(@Param('id') id: string) {
        return this.newsService.deleteNews(id);
    }

    @Put('featured/:id')
    async highlightIsFeatured(@Param('id') id: string, @Body() highlightIsFeaturedDto: HighlightIsFeaturedDto) {
        return this.newsService.highlightIsFeatured(id, highlightIsFeaturedDto);
    }

    @Put('priority/:id')
    async putPriority(@Param('id') id: string, @Body() putPriority: PutPriorityDto) {
        return this.newsService.putPriority(id, putPriority);

    }

    @Get('related/:slug')
    async getRelatedArticles(@Param('slug') slug: string) {
        return this.newsService.getRelatedArticles(slug);
    }


    




}