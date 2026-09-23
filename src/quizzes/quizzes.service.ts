import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { IdSequenceService } from 'src/prisma/id-sequence.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { CreateQuizInput } from './dto/create-quiz.input';
import { UpdateQuizInput } from './dto/update-quiz.input';
import { SubmitQuizAttemptInput } from './dto/submit-quiz-attempt.input';
import type { QuizQuestionInput } from './dto/quiz-question.input';

@Injectable()
export class QuizzesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSequence: IdSequenceService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private validateQuestions(questions: QuizQuestionInput[]) {
    for (const question of questions) {
      if (!question.prompt.trim()) {
        throw new BadRequestException('Every question needs a prompt');
      }

      const correctCount = question.options.filter(
        (option) => option.isCorrect,
      ).length;

      if (correctCount !== 1) {
        throw new BadRequestException(
          `Question "${question.prompt}" must have exactly one correct option`,
        );
      }

      if (question.options.some((option) => !option.text.trim())) {
        throw new BadRequestException(
          `Question "${question.prompt}" has an empty option`,
        );
      }
    }
  }

  private async buildQuestionCreateData(questions: QuizQuestionInput[]) {
    return Promise.all(
      questions.map(async (question, questionIndex) => ({
        id: await this.idSequence.next('QuizQuestion'),
        prompt: question.prompt.trim(),
        order: question.order ?? questionIndex,
        points: question.points ?? 1,
        options: {
          create: await Promise.all(
            question.options.map(async (option, optionIndex) => ({
              id: await this.idSequence.next('QuizOption'),
              text: option.text.trim(),
              isCorrect: option.isCorrect,
              order: option.order ?? optionIndex,
            })),
          ),
        },
      })),
    );
  }

  async create(input: CreateQuizInput, createdById: number) {
    this.validateQuestions(input.questions);

    const assignment = await this.prisma.assignment.findUnique({
      where: { id: input.assignmentId },
      select: { id: true, type: true },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment is not found');
    }

    if (assignment.type !== 'quiz') {
      throw new BadRequestException(
        'This assignment is not set up as an auto-graded quiz',
      );
    }

    const existingQuiz = await this.prisma.quiz.findUnique({
      where: { assignmentId: input.assignmentId },
      select: { id: true },
    });

    if (existingQuiz) {
      throw new BadRequestException(
        'This assignment already has a quiz - use updateQuiz to change its questions',
      );
    }

    return this.prisma.quiz.create({
      data: {
        id: await this.idSequence.next('Quiz'),
        assignmentId: input.assignmentId,
        createdById,
        questions: {
          create: await this.buildQuestionCreateData(input.questions),
        },
      },
      include: { questions: { include: { options: true } } },
    });
  }

  async update(input: UpdateQuizInput) {
    this.validateQuestions(input.questions);

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: input.quizId },
      select: { id: true },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz is not found');
    }

    const attemptCount = await this.prisma.quizAttempt.count({
      where: { quizId: input.quizId },
    });

    if (attemptCount > 0) {
      throw new BadRequestException(
        'This quiz already has student attempts and can no longer be edited',
      );
    }

    // Simplest correct approach for a small quiz: replace every question -
    // delete the old ones (cascades their options) and recreate.
    await this.prisma.quizQuestion.deleteMany({
      where: { quizId: input.quizId },
    });

    return this.prisma.quiz.update({
      where: { id: input.quizId },
      data: {
        questions: {
          create: await this.buildQuestionCreateData(input.questions),
        },
      },
      include: { questions: { include: { options: true } } },
    });
  }

  async remove(quizId: number) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz is not found');
    }

    return this.prisma.quiz.delete({
      where: { id: quizId },
      include: { questions: { include: { options: true } } },
    });
  }

  async getByAssignmentId(assignmentId: number) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { assignmentId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('This assignment has no quiz yet');
    }

    return quiz;
  }

  /** Answer-key-free - see QuizForAttempt/QuizQuestionForAttempt/QuizOptionForAttempt. */
  async getForAttempt(assignmentId: number) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { assignmentId },
      select: {
        id: true,
        assignmentId: true,
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            prompt: true,
            order: true,
            points: true,
            options: {
              orderBy: { order: 'asc' },
              select: { id: true, text: true, order: true },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('This assignment has no quiz yet');
    }

    return quiz;
  }

  async submitAttempt(input: SubmitQuizAttemptInput, studentId: number) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: input.assignmentId },
      include: {
        class: {
          select: {
            id: true,
            students: { where: { id: studentId }, select: { id: true } },
            teachers: { select: { id: true } },
          },
        },
        quiz: {
          include: { questions: { include: { options: true } } },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment is not found');
    }

    if (assignment.class.students.length === 0) {
      throw new ForbiddenException(
        'Student can only submit assignments for classes they belong to',
      );
    }

    if (assignment.status !== 'published') {
      throw new ForbiddenException(
        assignment.status === 'draft'
          ? 'This assignment has not been published yet'
          : 'This assignment is closed and no longer accepts submissions',
      );
    }

    if (assignment.type !== 'quiz' || !assignment.quiz) {
      throw new BadRequestException(
        'This assignment is not an auto-graded quiz',
      );
    }

    const existingSubmission = await this.prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: input.assignmentId,
          studentId,
        },
      },
      select: { id: true },
    });

    if (existingSubmission) {
      throw new ForbiddenException(
        'You have already submitted this quiz - quizzes accept a single attempt',
      );
    }

    const quiz = assignment.quiz;
    const answerByQuestionId = new Map(
      input.answers.map((answer) => [answer.questionId, answer.optionId]),
    );

    let score = 0;
    let maxScore = 0;

    for (const question of quiz.questions) {
      maxScore += question.points;

      const selectedOptionId = answerByQuestionId.get(question.id);

      if (selectedOptionId === undefined) {
        continue; // Unanswered question - scored as 0, not a hard error.
      }

      const selectedOption = question.options.find(
        (option) => option.id === selectedOptionId,
      );

      if (!selectedOption) {
        throw new BadRequestException(
          `Option ${selectedOptionId} does not belong to question ${question.id}`,
        );
      }

      if (selectedOption.isCorrect) {
        score += question.points;
      }
    }

    const gradedById = quiz.createdById ?? assignment.createdById;

    if (!gradedById) {
      throw new BadRequestException(
        'This quiz has no owning teacher to attribute the auto-grade to',
      );
    }

    // Grade.score is interpreted everywhere else in the app (manual grading,
    // the "X/{assignment.maxScore}" displays, gradeSubmission's own
    // maxScore validation) as "out of assignment.maxScore" - the quiz's own
    // raw point total (maxScore, e.g. 2 for two 1-point questions) is a
    // separate, independent number the teacher never sees or sets against
    // the assignment's maxScore (e.g. 100). Storing the raw quiz score
    // directly in Grade.score would silently misrepresent a 50%-correct
    // quiz as "1/100" instead of "50/100". QuizAttempt keeps the raw
    // score/maxScore (useful on its own - "you got 1 of 2 questions
    // right"); Grade.score is the same result scaled onto the assignment's
    // actual max.
    const gradeScore =
      maxScore > 0 ? (score / maxScore) * assignment.maxScore : 0;

    const submissionId = await this.idSequence.next('Submission');
    const attemptId = await this.idSequence.next('QuizAttempt');
    const gradeId = await this.idSequence.next('Grade');

    const answersRecord: Record<string, number> = {};
    for (const [questionId, optionId] of answerByQuestionId) {
      answersRecord[String(questionId)] = optionId;
    }

    const [submission] = await this.prisma.$transaction([
      this.prisma.submission.create({
        data: {
          id: submissionId,
          assignmentId: input.assignmentId,
          studentId,
          content: `Auto-graded quiz submission (${score}/${maxScore})`,
        },
        include: {
          student: { include: { role: true } },
          assignment: { include: { class: true, category: true } },
        },
      }),
      this.prisma.quizAttempt.create({
        data: {
          id: attemptId,
          quizId: quiz.id,
          studentId,
          submissionId,
          answers: answersRecord,
          score,
          maxScore,
        },
      }),
      this.prisma.grade.create({
        data: {
          id: gradeId,
          submissionId,
          score: gradeScore,
          feedback: 'Auto-graded quiz',
          gradedById,
        },
      }),
    ]);

    const teacherIds = assignment.class.teachers.map((teacher) => teacher.id);

    await Promise.all([
      this.notificationsService.createMany(
        teacherIds,
        'submission_received',
        `${submission.student.name} submitted ${assignment.title}`,
        undefined,
        `/classes/${assignment.classId}/assignments`,
      ),
      this.notificationsService.create(
        studentId,
        'submission_graded',
        `Your submission for ${assignment.title} was graded`,
        undefined,
        `/classes/${assignment.classId}/assignments`,
      ),
    ]);

    return this.prisma.quizAttempt.findUniqueOrThrow({
      where: { id: attemptId },
    });
  }
}
