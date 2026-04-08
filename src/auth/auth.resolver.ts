import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import type { Request } from 'express';
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
  registerAuth(
    @Args('loginAuthInput') registerAuthInput: RegisterAuthInput,
    @Context('req') req: Request,
  ) {
    const userAgentHeader = req.headers['user-agent'];
    const forwardedForHeader = req.headers['x-forwarded-for'];

    const browserAgent =
      typeof userAgentHeader === 'string' && userAgentHeader.trim().length > 0
        ? userAgentHeader
        : 'unknown';

    const forwardedIp = Array.isArray(forwardedForHeader)
      ? forwardedForHeader[0]
      : forwardedForHeader;

    const ipAddress =
      typeof forwardedIp === 'string' && forwardedIp.trim().length > 0
        ? forwardedIp.split(',')[0].trim()
        : (req.ip ?? req.socket.remoteAddress ?? '0.0.0.0');

    return this.authService.register(registerAuthInput, {
      browser_agent: browserAgent,
      ip_address: ipAddress,
    });
  }
}
