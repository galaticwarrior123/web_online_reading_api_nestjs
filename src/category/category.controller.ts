import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dtos/createCategoryDto.dto';
import { UpdateCategoryDto } from './dtos/updateCategoryDto.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('api/category')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Post('/create')
    @UseGuards(AuthGuard)
    async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoryService.create(createCategoryDto);
    }

    @Get('/all')
    async getAllCategories() {
        return this.categoryService.findAll();
    }

    @Put('/update')
    @UseGuards(AuthGuard)
    async updateCategory(@Body() updateCategoryDto: UpdateCategoryDto) {
        return this.categoryService.update(updateCategoryDto);
    }

    @Delete('/delete/:id')
    @UseGuards(AuthGuard)
    async deleteCategory(@Param('id') id: string) {
        await this.categoryService.delete(id);
        return { message: `Delete category with id ${id} - Not implemented` };
    }
}
