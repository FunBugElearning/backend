// Abstraction: User là class trừu tượng,
// chỉ định nghĩa những đặc điểm chung của mọi người dùng.
abstract class User {
  constructor(
    public name: string,
    private password: string,
    protected role: string,
  ) {}

  // Encapsulation: password là private,
  // bên ngoài không thể truy cập trực tiếp.
  public checkPassword(inputPassword: string): boolean {
    return this.password === inputPassword;
  }

  public introduce(): void {
    console.log(`My name is ${this.name}`);
  }

  // Class con bắt buộc phải tự triển khai method này.
  abstract getRole(): string;
}

// Inheritance: Student kế thừa User.
class Student extends User {
  constructor(name: string, password: string) {
    super(name, password, 'student');
  }

  // Polymorphism: Student có cách triển khai getRole riêng.
  public getRole(): string {
    return `Role: ${this.role}`;
  }

  public viewAssignments(): void {
    console.log(`${this.name} can view assignments.`);
  }
}

// Inheritance: Teacher cũng kế thừa User.
class Teacher extends User {
  constructor(name: string, password: string) {
    super(name, password, 'teacher');
  }

  // Polymorphism: Teacher triển khai getRole khác Student.
  public getRole(): string {
    return `Role: ${this.role}`;
  }

  public createAssignment(): void {
    console.log(`${this.name} can create assignments.`);
  }
}

const student = new Student('Khanh', '123456');
const teacher = new Teacher('John', 'abcdef');

student.introduce();
console.log(student.getRole());
console.log(student.checkPassword('123456'));
student.viewAssignments();

console.log('----------------');

teacher.introduce();
console.log(teacher.getRole());
console.log(teacher.checkPassword('wrong-password'));
teacher.createAssignment();
