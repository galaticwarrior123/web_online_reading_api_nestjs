import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ViewLog } from 'src/schemas/viewLog.schema';

@Injectable()
export class ViewLogService {
    constructor(
        @InjectModel(ViewLog.name) private viewLogModel: Model<ViewLog>,
    ) { }


    async createViewLog(data: any) {
        const { user, news, duration, sessionId, userAgent, isFinal } = data;

        // Tìm log hiện có theo session + news
        const existing = await this.viewLogModel.findOne({ news, sessionId });

        if (existing) {
            // Cộng dồn thời gian đọc
            existing.duration += duration;

            // Nếu lần này là log cuối, đánh dấu kết thúc
            if (isFinal && !existing.isFinal && isFinal == true) {
                existing.isFinal = true;
            } else if (isFinal == false) {
                existing.isFinal = false;
            }


            // Cập nhật userAgent nếu thay đổi
            if (userAgent && existing.userAgent !== userAgent) {
                existing.userAgent = userAgent;
            }

            // Nếu trước đó chưa có user, cập nhật user vào (trường hợp login sau khi đọc)
            if (!existing.user && user) {
                existing.user = user;
            }

            return existing.save();
        }

        // Nếu chưa có log, tạo bản ghi mới
        const log = new this.viewLogModel({
            user,
            news,
            duration,
            sessionId,
            userAgent,
            isFinal: !!isFinal, // đảm bảo boolean
            startTime: new Date(),
        });

        return log.save();
    }


}
