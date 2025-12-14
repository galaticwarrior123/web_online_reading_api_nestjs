import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Image } from 'src/schemas/image.schema';
import { RequestImageTraningDto } from './dtos/requestImageTraningDto.dto';
import { User } from 'src/schemas/user.schema';
import { News } from 'src/schemas/news.schema';
import { UpdateImageStatusDto } from './dtos/updateImageStatusDto.dto';
import { NotificationGateway } from 'src/notification/notification.gateway';

@Injectable()
export class ImageService {
    constructor(
        @InjectModel(Image.name) private imageModel: Model<Image>,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(News.name) private newsModel: Model<News>,
        private readonly notificationGateway: NotificationGateway,
    ) { }


    async requestImageTraining(
        dto: RequestImageTraningDto
    ) {

        const { listImage, senderId, roleReceiver, newsId } = dto;

        // Validate URL list
        if (!Array.isArray(listImage) || listImage.length === 0 ) {
            throw new Error("URL array cannot be empty and each URL must be a non-empty string");
        }

        const sender = await this.userModel.findById(senderId);
        if (!sender) throw new Error("Sender not found");

        const news = await this.newsModel.findById(newsId);
        if (!news) throw new Error("News not found");

        // Only handle receiver = admin
        if (roleReceiver !== "admin") return null;

        const admin = await this.userModel.findOne({ role: "admin" });
        if (!admin) throw new Error("No admin user found");

        const images = listImage.map(u => ({
            url: u.src,
            type: u.label,
            sender: new Types.ObjectId(senderId) ?? null,
            receiver: new Types.ObjectId(admin._id) ?? null,
            news: new Types.ObjectId(newsId) ?? null,
        }));


        this.notificationGateway.sendToUser(admin?._id, {
            title: "Hình ảnh của bạn đang được yêu cầu huấn luyện",
            sender: sender,
            createdAt: new Date().toLocaleString(),
        });

        return this.imageModel.insertMany(images);
    }


    async getImagesPendingTraining() {
        return this.imageModel.find({ status: 'pending' })
            .populate('sender', 'userName email')
            .populate('receiver', 'userName email')
            .populate('news', 'title')
            .exec();
    }




    async updateImageStatus(imageId: string, updateImageStatusDto: UpdateImageStatusDto) {
        const { status, rejectReason } = updateImageStatusDto;
        return this.imageModel.findByIdAndUpdate(
            imageId,
            { status, rejectReason },
            { new: true },
        );
    }
}
