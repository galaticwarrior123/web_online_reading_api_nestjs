import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { News } from 'src/schemas/news.schema';
import { ViewLog } from 'src/schemas/viewLog.schema';
import { PipelineStage } from "mongoose";

@Injectable()
export class DashboardService {
    constructor(
        @InjectModel(ViewLog.name) private viewLogModel: Model<ViewLog>,
        @InjectModel(News.name) private newsModel: Model<News>
    ) { }


    async getOverView() {

        const now = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(now.getDate() - 14);

        // --- Tổng bài viết ---
        const totalArticles = await this.newsModel.countDocuments();

        const thisWeekArticles = await this.newsModel.countDocuments({
            createdAt: { $gte: weekAgo },
            status: "published",
        });

        const lastWeekArticles = await this.newsModel.countDocuments({
            createdAt: { $gte: twoWeeksAgo, $lt: weekAgo },
            status: "published",
        })


        const growthArticles =
            lastWeekArticles > 0
                ? ((thisWeekArticles - lastWeekArticles) / lastWeekArticles) * 100
                : 100;


        // --- Tổng lượt xem ---
        const totalViews = await this.viewLogModel.countDocuments();

        const thisWeekViews = await this.viewLogModel.countDocuments({
            createdAt: { $gte: weekAgo },
        });
        const lastWeekViews = await this.viewLogModel.countDocuments({
            createdAt: { $gte: twoWeeksAgo, $lt: weekAgo },
        });
        const growthViews =
            lastWeekViews > 0
                ? ((thisWeekViews - lastWeekViews) / lastWeekViews) * 100
                : 100;


        // --- Tổng người đọc ---
        const totalReaders = await this.viewLogModel.countDocuments();

        const thisWeekReaders = await this.viewLogModel.distinct("sessionId", {
            createdAt: { $gte: weekAgo },
        });
        const lastWeekReaders = await this.viewLogModel.distinct("sessionId", {
            createdAt: { $gte: twoWeeksAgo, $lt: weekAgo },
        });
        const growthReaders =
            lastWeekReaders.length > 0
                ? ((thisWeekReaders.length - lastWeekReaders.length) /
                    lastWeekReaders.length) *
                100
                : 100;

        // --- TG Trung bình ---
        const thisWeekAvg = await this.viewLogModel.aggregate([
            { $match: { createdAt: { $gte: weekAgo }, isFinal: true } },
            { $group: { _id: null, avg: { $avg: "$duration" } } },
        ]);
        const lastWeekAvg = await this.viewLogModel.aggregate([
            { $match: { createdAt: { $gte: twoWeeksAgo, $lt: weekAgo }, isFinal: true } },
            { $group: { _id: null, avg: { $avg: "$duration" } } },
        ]);

        const thisWeekReadingTime = thisWeekAvg.length ? thisWeekAvg[0].avg : 0;
        const lastWeekReadingTime = lastWeekAvg.length ? lastWeekAvg[0].avg : 0;


        const growthReading =
            lastWeekReadingTime > 0
                ? ((thisWeekReadingTime - lastWeekReadingTime) / lastWeekReadingTime) * 100
                : 0;
        return {
            totalArticles: totalArticles,
            totalReaders: totalReaders,
            totalViews: totalViews,
            avgReadingTime: Math.round(thisWeekReadingTime),
            growth: {
                growthArticles: growthArticles,
                growthReaders: growthReaders,
                growthViews: growthViews,
                growthReading: growthReading
            }
        }
    }


    async getReadersByDay() {
        const now = new Date();
        const last7Days = new Date();
        last7Days.setDate(now.getDate() - 6);

        // --- Lấy dữ liệu từ DB ---
        const result = await this.viewLogModel.aggregate([
            { $match: { createdAt: { $gte: last7Days } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    readers: { $addToSet: "$sessionId" },
                },
            },
            {
                $project: {
                    day: "$_id",
                    readers: { $size: "$readers" },
                    _id: 0,
                },
            },
            { $sort: { day: 1 } },
        ]);

        // --- Tạo danh sách 7 ngày gần nhất ---
        const days: string[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const formatted = d.toISOString().split("T")[0];
            days.push(formatted);
        }

        // --- Merge dữ liệu ---
        const merged = days.map((day) => {
            const found = result.find((r) => r.day === day);
            return {
                day: day,
                readers: found ? found.readers : 0,
            };
        });

        return merged;
    }



    /** 3️⃣ Chuyên mục được đọc nhiều nhất */
    async getCategoryStats() {
        const result = await this.viewLogModel.aggregate([
            {
                $lookup: {
                    from: "news",
                    let: { newsId: { $toString: "$news" } },
                    pipeline: [
                        { $addFields: { idStr: { $toString: "$_id" } } },
                        { $match: { $expr: { $eq: ["$idStr", "$$newsId"] } } }
                    ],
                    as: "newsInfo"
                }
            },
            { $unwind: "$newsInfo" },
            {
                $group: {
                    _id: "$newsInfo.category",
                    value: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: "categories",
                    let: { catId: { $toString: "$_id" } },
                    pipeline: [
                        { $addFields: { idStr: { $toString: "$_id" } } },
                        { $match: { $expr: { $eq: ["$idStr", "$$catId"] } } }
                    ],
                    as: "cat"
                }
            },
            {
                $project: {
                    name: { $arrayElemAt: ["$cat.name.vi", 0] },
                    value: 1,
                    _id: 0,
                },
            },
            { $sort: { value: -1 } },
            { $limit: 5 },
        ]);


        return result;
    }

    /** 4️⃣ Top bài viết nổi bật */
    async getTopArticles() {
        const result = await this.viewLogModel.aggregate([
            {
                $group: {
                    _id: "$news",
                    views: { $sum: 1 },
                },
            },
            { $sort: { views: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "news",
                    let: { newsId: { $toString: "$_id" } },
                    pipeline: [
                        { $addFields: { idStr: { $toString: "$_id" } } },
                        { $match: { $expr: { $eq: ["$idStr", "$$newsId"] } } }
                    ],
                    as: "newsInfo"
                }
            },
            { $unwind: "$newsInfo" },
            {
                $lookup: {
                    from: "categories",
                    let: { catId: { $toString: "$newsInfo.category" } },
                    pipeline: [
                        { $addFields: { idStr: { $toString: "$_id" } } },
                        { $match: { $expr: { $eq: ["$idStr", "$$catId"] } } }
                    ],
                    as: "cat"
                }
            },
            {
                $project: {
                    title: "$newsInfo.title",
                    category: "$cat.name.vi",
                    views: 1,
                },
            },
        ]);

        return result;
    }

}
