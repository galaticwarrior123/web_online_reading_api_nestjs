import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from 'src/schemas/notification.schema';
import { User } from 'src/schemas/user.schema';
import { CreateNotificationDto } from './dto/createNotification.dto';
import { News } from 'src/schemas/news.schema';

@Injectable()
export class NotificationService {
    constructor(
        @InjectModel(Notification.name) private notificationModel: Model<Notification>,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(News.name) private newsModel: Model<News>
    ) { }

    async createNotification(createNotificationDto: CreateNotificationDto) {
        const { title, sender, receiver, articleId, role } = createNotificationDto;

        const article = await this.newsModel.findOne({ _id: articleId }).lean();

        // 🔹 Nếu có nhiều role => gửi cho tất cả user thuộc các role đó
        if (role && role.length > 0) {
            const users = await this.userModel.find({ role: { $in: role } }).select("_id");

            if (users.length === 0) {
                throw new Error(`Không tìm thấy user nào có role: ${role.join(", ")}`);
            }
            const notifications = users.map(user => ({
                title,
                sender,
                thumbnail: article?.featuredImage,
                link: article?.slug,
                receiver: user._id,
            }));

            // 🗄️ Lưu nhiều thông báo
            return this.notificationModel.insertMany(notifications);
        }
        // 🔹 Nếu có receiver cụ thể => chỉ gửi cho 1 người
        const newNotification = new this.notificationModel({
            title,
            sender,
            thumbnail: article?.featuredImage,
            link: article?.slug,
            receiver,
        });

        return newNotification.save();
    }


    async getNotificationByUser(userId: string) {
        const currentUser = await this.userModel.findOne({ _id: userId }).lean();
        if (!currentUser)
            throw new Error('User not found');

        const notifications = await this.notificationModel
            .find({ receiver: userId })
            .sort({ createdAt: -1 })
            .populate('sender', 'userName') // Populate sender field with name
            .lean(); // trả về object JS thay vì Mongoose Document

        return notifications;
    }

    async markReaded(id: string) {
        return this.notificationModel.findByIdAndUpdate(id, { isReaded: true });
    }
}



