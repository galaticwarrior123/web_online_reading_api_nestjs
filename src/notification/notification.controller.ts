import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/createNotification.dto';

@Controller('api/notification')
export class NotificationController {
    constructor(
        private readonly notificationService: NotificationService
    ) { }

    @Get("/:userId")
    async getNotificationByUser(@Param("userId") userId: string) {
        return this.notificationService.getNotificationByUser(userId);
    }

    @Post("create")
    async createNotification(@Body() createNotificationDto: CreateNotificationDto) {
        return this.notificationService.createNotification(createNotificationDto);
    }

    @Put("/markReaded/:id")
    async markReaded(@Param("id") id: string) {
        return this.notificationService.markReaded(id);
    }

}
