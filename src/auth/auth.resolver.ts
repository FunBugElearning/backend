import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { Auth } from './entities/auth.entity';
import { LoginAuthInput } from './dto/login-auth.input';
import { RegisterAuthInput } from './dto/register-auth.input';
import { getSessionMetadata } from 'src/utils/agent.utils';

@Resolver(() => Auth)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => Auth)
  loginAuth(
    @Args('loginAuthInput') loginAuthInput: LoginAuthInput,
    @Context('req') req: Request,
  ) {
    const sessionMetadata = getSessionMetadata(req);

    return this.authService.login(loginAuthInput, sessionMetadata);
  }

  @Mutation(() => Auth)
  registerAuth(
    @Args('registerAuthInput') registerAuthInput: RegisterAuthInput,
    @Context('req') req: Request,
  ) {
    const sessionMetadata = getSessionMetadata(req);

    return this.authService.register(registerAuthInput, sessionMetadata);
  }
}
