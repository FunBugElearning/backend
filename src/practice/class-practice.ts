class User {
  public name: string;
  private password: string;
  protected role: string;

  constructor(name: string, password: string, role: string) {
    this.name = name;
    this.password = password;
    this.role = role;
  }

  public introduce(): void {
    console.log(`My name is ${this.name}`);
  }

  public checkPassword(password: string): boolean {
    return this.password === password;
  }
}

const user = new User("Khanh", "123456", "student");

user.introduce();
console.log(user.name);
console.log(user.checkPassword("123456"));