import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
export class DashboardController {
    constructor(
        private readonly dashBoardService: DashboardService
    ){}

    @Get("overview")
    async GetOverView(){
        return this.dashBoardService.getOverView();
    }

    @Get("readers-by-day")
    async GetReadByDay(){
        return this.dashBoardService.getReadersByDay();
    }

    @Get("category-stats")
    async GetCategoryStats(){
        return this.dashBoardService.getCategoryStats();
    }

    @Get("top-articles")
    async GetListTopArticles(){
        return this.dashBoardService.getTopArticles()
    }

}
