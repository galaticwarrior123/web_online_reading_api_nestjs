import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateNewSettingsDto } from './dto/createNewSetting.dto';

@Controller('api/settings')
export class SettingsController {
    constructor(
        private readonly settingsService: SettingsService
    ) { }

    @Get("/")
    async getSettings() {
        return this.settingsService.get();
    }


    @Post("create")
    async createSettings(@Body() createSettingDto: CreateNewSettingsDto) {
        return this.settingsService.create(createSettingDto);
    }


    @Put("update")
    async updateSettings(@Body() updateSettingDto: CreateNewSettingsDto) {
        return this.settingsService.update(updateSettingDto);
    }
}
