import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings } from 'src/schemas/settings.schema';
import { CreateNewSettingsDto } from './dto/createNewSetting.dto';

@Injectable()
export class SettingsService {
    constructor(
        @InjectModel(Settings.name) private settingsModel: Model<Settings>
    ) { }

    async get() {
        const settings = await this.settingsModel.findOne().lean().exec();
        return settings;
    }

    async create(createNewSettingsDto: CreateNewSettingsDto) {
        const newSettings = new this.settingsModel(createNewSettingsDto);
        return newSettings.save();
    }

    async update(updateSettingsDto: CreateNewSettingsDto) {
        const currentSettings = await this.settingsModel.findOne().lean();

        if (!currentSettings) {
            // Nếu chưa có thì tạo mới
            const newSettings = new this.settingsModel(updateSettingsDto);
            return newSettings.save();
        }

        // Nếu đã có thì cập nhật
        return this.settingsModel.findByIdAndUpdate(
            currentSettings._id,
            { $set: updateSettingsDto },
            { new: true }
        );
    }
}
