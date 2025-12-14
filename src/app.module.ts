import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '@nestjs-modules/mailer';
import { CategoryModule } from './category/category.module';
import { NewsModule } from './news/news.module';
import { CommentModule } from './comment/comment.module';
import { TagsService } from './tags/tags.service';
import { ViewLogModule } from './view-log/view-log.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SettingsModule } from './settings/settings.module';
import { NotificationModule } from './notification/notification.module';
import { ImageModule } from './image/image.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV === 'deploy' ? '.env.deploy' : '.env',
      isGlobal: true, cache: true
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'), // lấy từ .env
      }),
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
    }),
    CategoryModule,
    NewsModule,
    CommentModule,
    ViewLogModule,
    DashboardModule,
    SettingsModule,
    NotificationModule,
    ImageModule,
  ],
  controllers: [AppController],
  providers: [AppService, TagsService],
})
export class AppModule { }
