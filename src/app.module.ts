import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { Request } from 'express';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AuthSessionsModule } from './auth_sessions/auth_sessions.module';
import { AuthAuditLogsModule } from './auth_audit_logs/auth_audit_logs.module';
import { ClassesModule } from './classes/classes.module';
import { RolesModule } from './roles/roles.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { AttendanceModule } from './attendance/attendance.module';
import { GradeCategoriesModule } from './grade-categories/grade-categories.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      path: '/graphql',
      context: ({ req }: { req: Request }) => ({ req }),
    }),
    UsersModule,
    AuthModule,
    AuthSessionsModule,
    AuthAuditLogsModule,
    ClassesModule,
    RolesModule,
    AssignmentsModule,
    AttendanceModule,
    GradeCategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
