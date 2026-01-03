import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { News } from 'src/schemas/news.schema';
import { CreateNewsDto } from './dtos/createNews.dto';
import slugify from 'slugify';
import { Category } from 'src/schemas/category.schema';
import { UpdateStatusDto } from './dtos/updateStatus.dto';
import { HighlightIsFeaturedDto } from './dtos/higlightIsFeatured.dto';
import { PutPriorityDto } from './dtos/putPriority.dto';
import { OpenAIService } from 'src/openai/openAI.service';
import { TagsService } from 'src/tags/tags.service';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { User } from 'src/schemas/user.schema';
import { NewsRevision } from 'src/schemas/newsRevision.schema';

@Injectable()
export class NewsService {
    constructor(
        @InjectModel(News.name) private newsModel: Model<News>,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(NewsRevision.name) private newsRevisionModel: Model<NewsRevision>,
        @InjectModel(Category.name) private categoryModel: Model<Category>,
        private readonly tagsService: TagsService,
        private readonly notificationGateway: NotificationGateway
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



    private parseSlug(slug: string) {
        // bỏ .html nếu có
        const cleanSlug = slug.replace(/\.html$/, "");

        // kiểm tra có đuôi là hex (id rút gọn, 6–24 ký tự)
        const match = cleanSlug.match(/^(.*)-([a-f0-9]{6,24})$/i);

        if (match) {
            return {
                type: "article",
                slug: match[1],   // phần slugify từ title
                id: match[2],     // phần id rút gọn (string)
            };
        }

        // nếu không match thì coi như category
        return {
            type: "category",
            category: cleanSlug,
        };
    }

    async create(newsData: CreateNewsDto): Promise<News> {
        const objectId = new Types.ObjectId();
        const slug = await this.generateSlug(newsData.title, objectId.toHexString());
        const autoTags = await this.tagsService.extractTags(newsData.title);
        const createdNews = new this.newsModel({ ...newsData, slug, tags: autoTags });
        return createdNews.save();
    }


    private shuffle<T>(array: T[]): T[] {
        return array
            .map((item) => ({ item, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ item }) => item);
    }

    async findBySlug(slug: string): Promise<any> {
        const parsedUrl = await this.parseSlug(slug);

        // Nếu là bài viết
        if (parsedUrl && parsedUrl.type === "article") {
            return this.newsModel
                .findOne({ slug })
                .populate("category")
                .populate("author", "userName")
                .exec();
        }

        // Nếu là category
        if (parsedUrl && parsedUrl.type === "category") {

            const category = await this.categoryModel.findOne({ slug: parsedUrl.category }).exec();
            if (!category) return null;

            // Lấy bài nổi bật nhất
            const topStory = await this.newsModel
                .findOne({ category: category._id, status: "published" })
                .sort({ isFeatured: -1, priorityInCategory: -1, createdAt: -1 })
                .populate("category")
                .populate("author", "userName")
                .exec();

            // Lấy tất cả bài còn lại (ngoại trừ topStory)
            let allArticles = await this.newsModel
                .find({
                    category: category._id,
                    status: "published",
                    ...(topStory ? { _id: { $ne: topStory._id } } : {})
                })
                .populate("category")
                .populate("author", "userName")
                .exec();

            // Gom nhóm theo priority
            const priorityGroups = allArticles.reduce((acc, article) => {
                const p = article.priorityInCategory || 0;
                if (!acc[p]) acc[p] = [];
                acc[p].push(article);
                return acc;
            }, {} as Record<number, News[]>);

            // Xếp theo priority giảm dần, shuffle trong nhóm
            let orderedArticles: News[] = [];
            Object.keys(priorityGroups)
                .sort((a, b) => Number(b) - Number(a))
                .forEach(priority => {
                    orderedArticles = orderedArticles.concat(this.shuffle(priorityGroups[priority]));
                });

            // 4 bài đầu tiên sau topStory
            const highlightArticles = orderedArticles.slice(0, 4);
            // Còn lại
            const otherArticles = orderedArticles.slice(4);

            return {
                topStory,
                highlightArticles,
                otherArticles
            };
        }

        return null;
    }

    async getFeaturedNews(limit = 5): Promise<News[]> {
        return this.newsModel
            .find({
                status: "published",
                isFeatured: true
            }).sort({ priorityInGlobal: -1, createdAt: -1 })
            .limit(limit)
            .populate("category")
            .populate("author", "userName")
            .exec();
    }

    async findById(id: string): Promise<News | null> {
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }

        return this.newsModel.findById(id).populate('category').populate('author').exec();
    }

    async incrementViews(slug: string): Promise<void> {
        const parsedUrl = await this.parseSlug(slug);
        if (parsedUrl && parsedUrl.type === "article") {
            await this.newsModel.findOneAndUpdate({ slug }, { $inc: { views: 1 } }).exec();
        }
    }


    async getNewsByAuthor(authorId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.newsModel.find({ author: authorId })
                .populate('category')
                .populate('author')
                .skip(skip)
                .limit(limit)
                .sort({
                    status: 1,
                    createdAt: -1
                })
                .exec(),

            this.newsModel.countDocuments({ author: authorId })
        ]);

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getNewsCraft(newsId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;
        if (!Types.ObjectId.isValid(newsId)) {
            return null;
        }

        const [item, total] = await Promise.all([
            this.newsRevisionModel.find({ news: newsId })
                .populate('news')
                .populate('category')
                .skip(skip)
                .limit(limit)
                .exec(),
            this.newsRevisionModel.countDocuments({ news: newsId })
        ]);

        return {
            items: item,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }


    async updateNews(id: string, updateData: Partial<CreateNewsDto>): Promise<News | NewsRevision | null> {
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }

        //const updatedNews = await this.newsModel.findByIdAndUpdate(id, { ...updateData, updatedAt: new Date() }, { new: true }).populate('category').populate('author').exec();

        const currentNews = await this.newsModel.findById(id).exec();
        if (!currentNews) {
            return null;
        }

        if (currentNews.status !== 'published') {
            return await this.newsModel.findByIdAndUpdate(
                id,
                { ...updateData, updatedAt: new Date() },
                { new: true }
            );
        }
        return await this.newsRevisionModel.create({
            news: currentNews._id,
            title: updateData.title ?? currentNews.title,
            content: updateData.content ?? currentNews.content,
            slug: currentNews.slug,
            status: 'draft',
            tags: await this.tagsService.extractTags(updateData.title ?? currentNews.title),
            createdAt: new Date(),
            category: updateData.category ?? currentNews.category,
        });

    }


    async deleteNews(id: string): Promise<boolean> {
        if (!Types.ObjectId.isValid(id)) {
            return false;
        }

        await this.newsModel.findByIdAndDelete(id).exec();
        return true;

    }

    async updateStatus(updateStatusDto: UpdateStatusDto): Promise<News | null> {
        const { id, status, approvedBy, reason } = updateStatusDto;
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }
        const updateData: any = { status };
        if (approvedBy && Types.ObjectId.isValid(approvedBy)) {
            updateData.approvedBy = approvedBy;
        }
        if (reason) {
            updateData.reason = reason;
        }
        const updatedNews = await this.newsModel.findByIdAndUpdate(id, updateData, { new: true }).populate('category').populate('author').exec();

        if (updateStatusDto.status === "published") {
            // Safely extract author id as string and call notification only when available
            const authorId = updatedNews?.author && (updatedNews.author as any)._id
                ? (updatedNews.author as any)._id.toString()
                : null;

            if (authorId) {
                this.notificationGateway.sendToUser(authorId, {
                    title: 'Bài viết mới của bạn được duyệt',
                    sender: approvedBy,
                    time: new Date().toLocaleString(),
                });
            }
        }

        if (updateStatusDto.status === "rejected") {
            // Handle rejection logic here
            const authorId = updatedNews?.author && (updatedNews.author as any)._id
                ? (updatedNews.author as any)._id.toString()
                : null;
            if (authorId) {
                this.notificationGateway.sendToUser(authorId, {
                    title: 'Bài viết của bạn bị từ chối vì: ' + (reason || 'Không có lý do cụ thể'),
                    sender: approvedBy,
                    time: new Date().toLocaleString(),
                });
            }

        }

        if (updateStatusDto.status === "pending") {
            // ✅ 1. Lấy danh sách user có quyền "editor"
            const editors = await this.userModel
                .find({ role: { $in: ["editor", "chief_editor"] } })
                .select("_id");


            // ✅ 2. Lấy ID tác giả bài viết (nếu có)
            const authorId =
                updatedNews?.author && (updatedNews.author as any)._id
                    ? (updatedNews.author as any)._id.toString()
                    : null;

            // ✅ 3. Gửi thông báo cho tất cả editor
            for (const editor of editors) {
                this.notificationGateway.sendToUser(editor._id.toString(), {
                    title: "Có bài viết mới đang chờ duyệt",
                    sender: authorId ?? "system",
                    createdAt: new Date().toLocaleString(),
                });
            }

            // ✅ 4. (Tùy chọn) Gửi lại thông báo cho tác giả nếu muốn
            if (authorId) {
                this.notificationGateway.sendToUser(authorId, {
                    title: "Bài viết của bạn đang được xét duyệt",
                    sender: "system",
                    createdAt: new Date().toLocaleString(),
                });
            }
        }

        return updatedNews;
    }

    async getAllNews(page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.newsModel.find()
                .populate('category')
                .populate('author')
                .skip(skip)
                .limit(limit)
                .sort({
                    createdAt: -1,
                    status: 1
                })
                .exec(),
            this.newsModel.countDocuments()
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async highlightIsFeatured(id: string, highlightIsFeaturedDto: HighlightIsFeaturedDto): Promise<News | null> {
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }

        const updatedNews = await this.newsModel.findByIdAndUpdate(id, { isFeatured: highlightIsFeaturedDto.isFeatured }, { new: true }).populate('category').populate('author').exec();
        return updatedNews;
    }


    async putPriority(id: string, priority: PutPriorityDto): Promise<News | null> {
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }

        const updatedNews = await this.newsModel.findByIdAndUpdate(id, { priorityInGlobal: priority.priorityInGlobal, priorityInCategory: priority.priorityInCategory }, { new: true }).populate('category').populate('author').exec();
        return updatedNews;
    }

    async getRelatedArticles(slug: string, limit = 5): Promise<News[]> {
        const currentNews = await this.newsModel.findOne({ slug }).exec();
        if (!currentNews) {
            return [];
        }

        if (!currentNews || !currentNews.tags || currentNews.tags.length === 0) {
            return [];
        }

        const relatedArticles = await this.newsModel.find({
            _id: { $ne: currentNews._id }, // loại bỏ bài hiện tại
            tags: { $in: currentNews.tags } // có ít nhất 1 tag trùng
        })
            .limit(limit)
            .exec();

        return relatedArticles;
    }


    async getTopViewedArticles(limit = 5, categorySlug?: string, slug?: string): Promise<News[]> {
        if (categorySlug) {
            const category = await this.categoryModel.findOne({ slug: categorySlug }).exec();
            if (!category) return [];
            return this.newsModel.find({ status: "published", category: category._id }).sort({ views: -1 }).limit(limit).populate('category').populate('author').exec();
        }
        if (slug) {
            return this.newsModel.find({ status: "published", slug: { $ne: slug } }).sort({ views: -1 }).limit(limit).populate('category').populate('author').exec();
        }
        return this.newsModel.find({ status: "published" }).sort({ views: -1 }).limit(limit).populate('category').populate('author').exec();
    }


    async getLastedArticles(limit = 5, slug?: string): Promise<News[]> {
        const filter: any = { status: "published" };

        if (slug) {
            // loại bỏ bài viết có slug được truyền vào
            filter.slug = { $ne: slug };
        }

        return this.newsModel
            .find(filter)
            .sort({ createdAt: -1 }) // lấy mới nhất
            .limit(limit) // đủ số lượng cần lấy
            .populate("category")
            .populate("author")
            .exec();
    }

    async getArticlesBySearch(keySearch: string) {
        const results = await this.newsModel.find(
            { $text: { $search: keySearch } },
            { score: { $meta: "textScore" } }
        ).sort({ score: { $meta: "textScore" } });
        return results;
    }


    async checkTimeUndoArticle(idUser: string) {
        const FIFTEEN_MINUTES = 15 * 60 * 1000;
        const expiredTime = new Date(Date.now() - FIFTEEN_MINUTES);

        await this.newsModel.updateMany(
            {
                author: idUser,
                status: "pending",
                updatedAt: { $lt: expiredTime },
            },
            {
                $set: { isCanUndo: false },
            }
        );
    }


}