import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { QuizzesService } from './quizzes.service';
import { Quiz } from './entities/quiz.entity';
import { QuizForAttempt } from './entities/quiz-for-attempt.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { CreateQuizInput } from './dto/create-quiz.input';
import { UpdateQuizInput } from './dto/update-quiz.input';
import { SubmitQuizAttemptInput } from './dto/submit-quiz-attempt.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyAuthenticatedUser } from '../middleware/role-authorization.middleware';

@Resolver()
export class QuizzesResolver {
  constructor(
    private readonly quizzesService: QuizzesService,
    private readonly prisma: PrismaService,
  ) {}

  // Same ownership pattern as AssignmentsResolver, resolved through the
  // assignment the quiz belongs to.

  private async assertCanManageAssignmentClass(
    req: Request,
    assignmentId: number,
  ): Promise<number> {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        class: {
          select: {
            teachers: {
              where: { id: validation.userId },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment is not found');
    }

    const role = validation.role.toLowerCase();

    if (role === 'admin') {
      return validation.userId;
    }

    if (role !== 'teacher') {
      throw new ForbiddenException('Admin or teacher role is required');
    }

    if (assignment.class.teachers.length === 0) {
      throw new ForbiddenException(
        'Teacher can only manage quizzes for classes they teach',
      );
    }

    return validation.userId;
  }

  private async assertCanManageQuiz(
    req: Request,
    quizId: number,
  ): Promise<void> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: { assignmentId: true },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz is not found');
    }

    await this.assertCanManageAssignmentClass(req, quiz.assignmentId);
  }

  @Mutation(() => Quiz)
  async createQuiz(
    @Args('input') input: CreateQuizInput,
    @Context('req') req: Request,
  ) {
    const currentUserId = await this.assertCanManageAssignmentClass(
      req,
      input.assignmentId,
    );
    return this.quizzesService.create(input, currentUserId);
  }

  @Mutation(() => Quiz)
  async updateQuiz(
    @Args('input') input: UpdateQuizInput,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageQuiz(req, input.quizId);
    return this.quizzesService.update(input);
  }

  @Mutation(() => Quiz)
  async removeQuiz(
    @Args('id', { type: () => Int }) id: number,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageQuiz(req, id);
    return this.quizzesService.remove(id);
  }

  /**
   * Teacher/admin management view - includes the answer key (isCorrect).
   */
  @Query(() => Quiz, { name: 'quizByAssignmentId' })
  async findByAssignmentId(
    @Args('assignmentId', { type: () => Int }) assignmentId: number,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageAssignmentClass(req, assignmentId);
    return this.quizzesService.getByAssignmentId(assignmentId);
  }

  /**
   * Student-facing view for taking a quiz - the returned type has no
   * isCorrect field anywhere, so the answer key structurally cannot leak
   * here regardless of what a client requests.
   */
  @Query(() => QuizForAttempt, { name: 'quizToTake' })
  async getQuizToTake(
    @Args('assignmentId', { type: () => Int }) assignmentId: number,
    @Context('req') req: Request,
  ) {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        class: {
          select: {
            students: {
              where: { id: validation.userId },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment is not found');
    }

    const isAdmin = validation.role.toLowerCase() === 'admin';
    const isStudentOfClass = assignment.class.students.length > 0;

    if (!isAdmin && !isStudentOfClass) {
      throw new ForbiddenException(
        'You must belong to this class to take this quiz',
      );
    }

    return this.quizzesService.getForAttempt(assignmentId);
  }

  @Mutation(() => QuizAttempt)
  async submitQuizAttempt(
    @Args('input') input: SubmitQuizAttemptInput,
    @Context('req') req: Request,
  ) {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    return this.quizzesService.submitAttempt(input, validation.userId);
  }
}
