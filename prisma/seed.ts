// Development-only seed script. Never run against a production database.
//
// Idempotency strategy: Role and User rows are upserted by their unique
// `name`/`email`, so re-running the script against existing accounts is
// safe. Class/Assignment/Submission/Grade/AttendanceSession/
// AttendanceRecord/ClassGradeCategory have no natural unique key to upsert
// against, so this script wipes and recreates just that classroom-domain
// data on every run, giving a clean, predictable state each time.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.utils';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

// Documented in .claude/TEST_STRATEGY.md. Never used outside local dev.
const SEED_PASSWORD = 'Password123!';

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function upsertRole(name: string, description: string) {
  return prisma.role.upsert({
    where: { name },
    update: {},
    create: { name, description },
  });
}

async function upsertUser(params: {
  name: string;
  email: string;
  roleId: number;
  dateOfBirth: Date;
  address?: string;
  phoneNumber?: string;
}) {
  const password = await hashPassword(SEED_PASSWORD);

  return prisma.user.upsert({
    where: { email: params.email },
    update: {},
    create: {
      name: params.name,
      email: params.email,
      password,
      dateOfBirth: params.dateOfBirth,
      address: params.address,
      phoneNumber: params.phoneNumber,
      role_id: params.roleId,
    },
  });
}

async function main() {
  console.log('Seeding roles...');
  const adminRole = await upsertRole('admin', 'Admin role');
  const teacherRole = await upsertRole('teacher', 'Teacher role');
  const studentRole = await upsertRole('student', 'Default student role');

  console.log('Seeding admin...');
  const admin = await upsertUser({
    name: 'Admin User',
    email: 'admin@funbugakademy.dev',
    roleId: adminRole.id,
    dateOfBirth: new Date('1985-01-01'),
  });

  console.log('Seeding teachers...');
  const teacherSeeds = [
    { name: 'Ms. Linh Nguyen', email: 'linh.nguyen@funbugakademy.dev' },
    { name: 'Mr. Duy Tran', email: 'duy.tran@funbugakademy.dev' },
  ];
  const teachers: Awaited<ReturnType<typeof upsertUser>>[] = [];
  for (const teacher of teacherSeeds) {
    teachers.push(
      await upsertUser({
        name: teacher.name,
        email: teacher.email,
        roleId: teacherRole.id,
        dateOfBirth: new Date('1990-01-01'),
      }),
    );
  }

  console.log('Seeding students...');
  const studentSeeds = Array.from({ length: 10 }, (_, i) => ({
    name: `Student ${i + 1}`,
    email: `student${i + 1}@funbugakademy.dev`,
  }));
  const students: Awaited<ReturnType<typeof upsertUser>>[] = [];
  for (const student of studentSeeds) {
    students.push(
      await upsertUser({
        name: student.name,
        email: student.email,
        roleId: studentRole.id,
        dateOfBirth: new Date('2005-06-15'),
      }),
    );
  }

  console.log('Clearing existing classroom-domain data...');
  await prisma.grade.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.classGradeCategory.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.class.deleteMany();

  console.log('Seeding classes...');
  const class1 = await prisma.class.create({
    data: {
      name: 'Mentor Bootcamp 1-2026',
      description:
        'A structured review class for core concepts, assignments, and guided practice.',
      createdById: admin.id,
      teachers: { connect: [{ id: teachers[0].id }] },
      students: { connect: students.slice(0, 6).map((s) => ({ id: s.id })) },
    },
  });

  const class2 = await prisma.class.create({
    data: {
      name: 'FullStack S5 Mentor 1:1',
      description:
        'A practical class on frontend and backend integration for full-stack projects.',
      createdById: admin.id,
      teachers: { connect: [{ id: teachers[1].id }] },
      students: { connect: students.slice(5, 10).map((s) => ({ id: s.id })) },
    },
  });

  console.log('Seeding grade categories...');
  const class1Homework = await prisma.classGradeCategory.create({
    data: { classId: class1.id, name: 'Homework', weight: 40 },
  });
  const class1Exams = await prisma.classGradeCategory.create({
    data: { classId: class1.id, name: 'Exams', weight: 60 },
  });
  const class2Homework = await prisma.classGradeCategory.create({
    data: { classId: class2.id, name: 'Homework', weight: 50 },
  });
  await prisma.classGradeCategory.create({
    data: { classId: class2.id, name: 'Final Project', weight: 50 },
  });

  console.log('Seeding assignments...');
  const class1Assignment1 = await prisma.assignment.create({
    data: {
      title: 'Array Fundamentals',
      description: 'Solve the provided array manipulation exercises.',
      deadline: daysFromNow(7),
      topic: 'Arrays',
      classId: class1.id,
      categoryId: class1Homework.id,
      maxScore: 100,
      createdById: teachers[0].id,
    },
  });
  await prisma.assignment.create({
    data: {
      title: 'Midterm Exam',
      description: 'Covers weeks 1-6.',
      deadline: daysFromNow(14),
      topic: 'Review',
      classId: class1.id,
      categoryId: class1Exams.id,
      maxScore: 100,
      createdById: teachers[0].id,
    },
  });
  const class2Assignment1 = await prisma.assignment.create({
    data: {
      title: 'REST API with Auth',
      description: 'Build a small REST API with JWT authentication.',
      deadline: daysFromNow(10),
      topic: 'Backend',
      classId: class2.id,
      categoryId: class2Homework.id,
      maxScore: 100,
      createdById: teachers[1].id,
    },
  });

  console.log('Seeding submissions and grades...');
  const class1Students = students.slice(0, 6);
  for (const [index, student] of class1Students.entries()) {
    const submission = await prisma.submission.create({
      data: {
        assignmentId: class1Assignment1.id,
        studentId: student.id,
        content: `${student.name}'s submission for Array Fundamentals.`,
      },
    });

    // Grade about half of them, leaving the rest ungraded so the UI has a
    // realistic mix of pending/graded submissions to show.
    if (index % 2 === 0) {
      await prisma.grade.create({
        data: {
          submissionId: submission.id,
          score: 80 + index,
          feedback: 'Good work — watch your edge cases.',
          gradedById: teachers[0].id,
        },
      });
    }
  }

  const class2Students = students.slice(5, 10);
  for (const student of class2Students) {
    await prisma.submission.create({
      data: {
        assignmentId: class2Assignment1.id,
        studentId: student.id,
        content: `${student.name}'s submission for REST API with Auth.`,
      },
    });
  }

  console.log('Seeding attendance...');
  const attendanceStatuses = [
    'present',
    'present',
    'late',
    'absent',
    'present',
    'excused',
  ] as const;

  for (const [classIndex, { classRow, classStudents, teacher }] of [
    { classRow: class1, classStudents: class1Students, teacher: teachers[0] },
    { classRow: class2, classStudents: class2Students, teacher: teachers[1] },
  ].entries()) {
    for (let sessionIndex = 0; sessionIndex < 2; sessionIndex++) {
      const session = await prisma.attendanceSession.create({
        data: {
          classId: classRow.id,
          createdById: teacher.id,
          attendanceDate: daysFromNow(-14 + sessionIndex * 7 + classIndex),
          title: `Week ${sessionIndex + 1} Session`,
        },
      });

      for (const [studentIndex, student] of classStudents.entries()) {
        await prisma.attendanceRecord.create({
          data: {
            attendanceSessionId: session.id,
            studentId: student.id,
            status:
              attendanceStatuses[
                (studentIndex + sessionIndex) % attendanceStatuses.length
              ],
          },
        });
      }
    }
  }

  console.log('Seed complete.');
  console.log('---');
  console.log(`Admin:    admin@funbugakademy.dev / ${SEED_PASSWORD}`);
  console.log(`Teacher:  linh.nguyen@funbugakademy.dev / ${SEED_PASSWORD}`);
  console.log(`Teacher:  duy.tran@funbugakademy.dev / ${SEED_PASSWORD}`);
  console.log(
    `Student:  student1@funbugakademy.dev / ${SEED_PASSWORD} (through student10@...)`,
  );
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
