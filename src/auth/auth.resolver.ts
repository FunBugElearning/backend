import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { Auth } from './entities/auth.entity';
import { LoginAuthInput } from './dto/login-auth.input';
import { RegisterAuthInput } from './dto/register-auth.input';

@Resolver(() => Auth)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => Auth)
  loginAuth(@Args('loginAuthInput') loginAuthInput: LoginAuthInput) {
    return this.authService.login(loginAuthInput);
  }

  @Mutation(() => Auth)
  registerAuth(@Args('loginAuthInput') registerAuthInput: RegisterAuthInput) {
    return this.authService.register(registerAuthInput);
  }
}
