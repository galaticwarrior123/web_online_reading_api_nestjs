import { Body, Controller, Post } from '@nestjs/common';
import { ViewLogService } from './view-log.service';

@Controller('view-log')
export class ViewLogController {
    constructor(
        private readonly ViewLogService: ViewLogService
    ) { }

    @Post()
    async create(@Body() body: any) {
        return this.ViewLogService.createViewLog(body);
    }



}
