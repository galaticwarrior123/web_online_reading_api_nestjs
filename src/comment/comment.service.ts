import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from 'src/schemas/comment.schema';
import { CommentCreateDto } from './dtos/commentCreate.dto';
import { News } from 'src/schemas/news.schema';
import { ReactionDataDto } from './dtos/reactionData.dto';
import slugify from 'slugify';

@Injectable()
export class CommentService {
    constructor(
        @InjectModel(Comment.name) private commentModel: Model<Comment>,
        @InjectModel(News.name) private newsModel: Model<News>,
    ) { }



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

    async create(commentCreateDto: CommentCreateDto): Promise<Comment> {
        const newComment = new this.commentModel(commentCreateDto);
        const saved = await newComment.save();
        return saved.populate("user");
    }

    async findBySlug(slug: string) {
        const parsedUrl = this.parseSlug(slug);
        if (parsedUrl && parsedUrl.type === "article") {
            const news = await this.newsModel.findOne({ slug }).exec();
            if (!news) {
                throw new Error('News not found');
            }

            // lấy tất cả comment liên quan đến news
            const comments = await this.commentModel
                .find({ news: news._id })
                .populate('user', 'userName')
                .lean(); // dùng lean cho nhẹ

            // chuyển thành map để dễ xử lý
            const commentMap = new Map<string, any>();
            comments.forEach(c => {
                c.replies = [];
                commentMap.set(c._id.toString(), c);
            });

            // build tree
            const roots: any[] = [];
            comments.forEach(c => {
                if (c.parentComment) {
                    const parent = commentMap.get(c.parentComment.toString());
                    if (parent) {
                        parent.replies.push(c);
                    }
                } else {
                    roots.push(c); // comment gốc
                }
            });

            return roots; 
        }
    }


    async selectReactionComment(reactionDataDto: ReactionDataDto) {
        const { reactionType, user, commentId } = reactionDataDto;

        const comment = await this.commentModel.findById(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }

        let alreadyReacted = false;

        // Xóa user khỏi tất cả reaction trước đó
        comment.reactions.forEach((users, type) => {
            const filtered = users.filter((u: any) => u.toString() !== user.toString());

            if (filtered.length !== users.length && type === reactionType) {
                // user đã có cùng loại reaction trước đó
                alreadyReacted = true;
            }

            comment.reactions.set(type, filtered);
        });

        // Nếu trước đó user chưa chọn reactionType này → thêm vào
        if (!alreadyReacted) {
            const currentUsers = comment.reactions.get(reactionType) || [];
            currentUsers.push(user as any);
            comment.reactions.set(reactionType, currentUsers);
        }

        await comment.save();
        return comment;
    }
}
