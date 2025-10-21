import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import slugify from 'slugify';
import { Category } from 'src/schemas/category.schema';
import { CreateCategoryDto } from './dtos/createCategoryDto.dto';
import { UpdateCategoryDto } from './dtos/updateCategoryDto.dto';

@Injectable()
export class CategoryService {
    constructor(@InjectModel(Category.name) private categoryModel: Model<Category>) { }

    private async generateSlug(title: string): Promise<string> {
        let baseSlug = slugify(title, {
            lower: true,
            strict: true,
            locale: "vi",
        });

        let slug = baseSlug;
        let counter = 1;

        while (await this.categoryModel.exists({ slug })) {
            slug = `${baseSlug}-${counter++}`;
        }

        return slug;
    }

    async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
        const newCategory = new this.categoryModel({
            name: createCategoryDto.name,
        });
        newCategory.slug = await this.generateSlug(createCategoryDto.name.vi);
        return newCategory.save();
    }

    async findAll(): Promise<Category[]> {
        return this.categoryModel.find().exec();
    }

    async update(updateCategoryDto: UpdateCategoryDto): Promise<Category> {
        const category = await this.categoryModel.findById(updateCategoryDto.id);
        if (!category) {
            throw new Error('Category not found');
        }
        category.name = updateCategoryDto.name;
        category.slug = await this.generateSlug(updateCategoryDto.name.vi);
        return category.save();
    }   

    async delete(id: string): Promise<void> {
        await this.categoryModel.findByIdAndDelete(id);
    }
}
