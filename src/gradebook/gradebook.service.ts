import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GradebookService {
  constructor(private readonly prisma: PrismaService) {}

  async getClassGradebook(classId: number) {
    const classItem = await this.prisma.class.findUnique({
      where: {
        id: classId,
      },
      include: {
        students: {
          include: {
            role: true,
          },
          orderBy: {
            id: 'asc',
          },
        },
        gradeCategories: {
          include: {
            assignments: {
              include: {
                submissions: {
                  include: {
                    grade: true,
                  },
                },
              },
              orderBy: {
                id: 'asc',
              },
            },
          },
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    const students = classItem.students.map((student) => {
      const categoryScores = classItem.gradeCategories.map((category) => {
        const assignments = category.assignments;

        let averagePercent = 0;

        if (assignments.length > 0) {
          const totalPercent = assignments.reduce((sum, assignment) => {
            const submission = assignment.submissions.find(
              (item) => item.studentId === student.id,
            );

            const score = submission?.grade?.score ?? 0;

            const percent =
              assignment.maxScore > 0
                ? (score / assignment.maxScore) * 100
                : 0;

            return sum + percent;
          }, 0);

          averagePercent = totalPercent / assignments.length;
        }

        const weightedScore = (averagePercent * category.weight) / 100;

        return {
          categoryId: category.id,
          categoryName: category.name,
          weight: category.weight,
          averagePercent: Number(averagePercent.toFixed(2)),
          weightedScore: Number(weightedScore.toFixed(2)),
        };
      });

      const finalScore = categoryScores.reduce(
        (sum, categoryScore) => sum + categoryScore.weightedScore,
        0,
      );

      return {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        finalScore: Number(finalScore.toFixed(2)),
        categoryScores,
      };
    });

    return {
      classId: classItem.id,
      className: classItem.name,
      students,
    };
  }

  async getStudentOwnGrades(classId: number, studentId: number) {
    const classItem = await this.prisma.class.findUnique({
      where: {
        id: classId,
      },
      include: {
        students: {
          where: {
            id: studentId,
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        gradeCategories: {
          include: {
            assignments: {
              include: {
                submissions: {
                  where: {
                    studentId,
                  },
                  include: {
                    grade: true,
                  },
                },
              },
              orderBy: {
                id: 'asc',
              },
            },
          },
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    const student = classItem.students[0];

    if (!student) {
      throw new ForbiddenException('Student does not belong to this class');
    }

    const categoryScores = classItem.gradeCategories.map((category) => {
      const assignments = category.assignments;

      let averagePercent = 0;

      if (assignments.length > 0) {
        const totalPercent = assignments.reduce((sum, assignment) => {
          const submission = assignment.submissions[0];

          const score = submission?.grade?.score ?? 0;

          const percent =
            assignment.maxScore > 0
              ? (score / assignment.maxScore) * 100
              : 0;

          return sum + percent;
        }, 0);

        averagePercent = totalPercent / assignments.length;
      }

      const weightedScore = (averagePercent * category.weight) / 100;

      return {
        categoryId: category.id,
        categoryName: category.name,
        weight: category.weight,
        averagePercent: Number(averagePercent.toFixed(2)),
        weightedScore: Number(weightedScore.toFixed(2)),
      };
    });

    const finalScore = categoryScores.reduce(
      (sum, categoryScore) => sum + categoryScore.weightedScore,
      0,
    );

    return {
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      finalScore: Number(finalScore.toFixed(2)),
      categoryScores,
    };
  }
}