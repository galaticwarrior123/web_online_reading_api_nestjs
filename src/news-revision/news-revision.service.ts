import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import slugify from 'slugify';
import { News } from 'src/schemas/news.schema';
import { NewsRevision } from 'src/schemas/newsRevision.schema';

@Injectable()
export class NewsRevisionService {
    constructor(
        @InjectModel(NewsRevision.name) private newsRevisionModel: Model<NewsRevision>,
        @InjectModel(News.name) private newsModel: Model<News>,
    ) { }


    private async generateSlug(title: string, id: string): Promise<string> {
        let baseSlug = slugify(title, {
            lower: true,
            strict: true,
            locale: "vi",
        });

        let slug = baseSlug;
        let counter = 1;

        while (await this.newsModel.exists({ slug })) {
            slug = `${baseSlug}-${counter++}`;
        }

        return slug + '-' + id.slice(-6);
    }


    async getAllNewsRevision(page: number, limit: number) {

        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.newsRevisionModel.find()
                .populate('category')
                .populate('news')
                .skip(skip)
                .limit(limit)
                .sort({
                    createdAt: -1,
                    status: 1
                })
                .exec(),
            this.newsRevisionModel.countDocuments()
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async getNewsRevisionByNewsId(newsId: string, page: number, limit: number) {
        try {
            const skip = (page - 1) * limit;
            const [items, total] = await Promise.all([
                this.newsRevisionModel.find({ news: newsId })
                    .populate('category')
                    .populate('news')
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 })
                    .exec(),
                this.newsRevisionModel.countDocuments({ news: newsId })
            ]);
            return {
                items,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            throw error;
        }
    }

    async updateStatusNewsRevision(id: string, status: string) {

        try {
            const revision = await this.newsRevisionModel
                .findByIdAndUpdate(
                    id,
                    { status },
                    { new: true }
                )
                .exec();

            if (!revision) {
                throw new Error('News revision not found');
            }
            await this.newsModel.findByIdAndUpdate(
                revision.news._id,
                { hasPendingDraft: true },
                { new: true }
            ).exec();

            return revision;
        } catch (error) {
            throw error;
        }
    }

    async approveNewsRevision(id: string) {
        const revision = await this.newsRevisionModel.findById(id).exec();

        if (!revision) {
            throw new Error('News revision not found');
        }

        const news = await this.newsModel.findById(revision.news).exec();

        if (!news) {
            throw new Error('News not found');
        }

        news.title = revision.title;
        news.content = revision.content;
        news.category = revision.category;
        news.tags = revision.tags;
        news.slug = await this.generateSlug(revision.title, news._id.toString());
        news.updatedAt = new Date();
        news.hasPendingDraft = false;
        await news.save();

        revision.status = 'published';
        revision.isCanUndo = true;
        await revision.save();
    }
}
