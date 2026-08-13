import { Context, Query, Resolver } from '@nestjs/graphql';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import { DashboardService } from './dashboard.service';
import { AdminDashboard } from './entities/admin-dashboard.entity';
import { TeacherDashboard } from './entities/teacher-dashboard.entity';
import { StudentDashboard } from './entities/student-dashboard.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  verifyAdminRole,
  verifyAuthenticatedUser,
} from '../middleware/role-authorization.middleware';

@Resolver()
export class DashboardResolver {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertAdmin(req: Request): Promise<void> {
    const validation = await verifyAdminRole(req, this.prisma);

    if (!validation.ok) {
      if (validation.status === 'forbidden') {
        throw new ForbiddenException(validation.message);
      }

      throw new UnauthorizedException(validation.message);
    }
  }

  private async assertRole(
    req: Request,
    role: 'teacher' | 'student',
  ): Promise<number> {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    if (validation.role.toLowerCase() !== role) {
      throw new ForbiddenException(
        `${role[0].toUpperCase()}${role.slice(1)} role is required`,
      );
    }

    return validation.userId;
  }

  @Query(() => AdminDashboard, { name: 'adminDashboard' })
  async getAdminDashboard(@Context('req') req: Request) {
    await this.assertAdmin(req);

    return this.dashboardService.getAdminDashboard();
  }

  @Query(() => TeacherDashboard, { name: 'teacherDashboard' })
  async getTeacherDashboard(@Context('req') req: Request) {
    const teacherId = await this.assertRole(req, 'teacher');

    return this.dashboardService.getTeacherDashboard(teacherId);
  }

  @Query(() => StudentDashboard, { name: 'studentDashboard' })
  async getStudentDashboard(@Context('req') req: Request) {
    const studentId = await this.assertRole(req, 'student');

    return this.dashboardService.getStudentDashboard(studentId);
  }
}
