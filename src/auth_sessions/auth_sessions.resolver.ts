import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AuthSessionsService } from './auth_sessions.service';
import { AuthSession } from './entities/auth_session.entity';
import { UpdateAuthSessionInput } from './dto/update-auth_session.input';

@Resolver(() => AuthSession)
export class AuthSessionsResolver {
  constructor(private readonly authSessionsService: AuthSessionsService) {}

  @Mutation(() => AuthSession)
  createAuthSession() {
    return this.authSessionsService.create();
  }

  @Query(() => [AuthSession], { name: 'authSessions' })
  findAll() {
    return this.authSessionsService.findAll();
  }

  @Query(() => AuthSession, { name: 'authSession' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.authSessionsService.findOne(id);
  }

  @Mutation(() => AuthSession)
  updateAuthSession(
    @Args('updateAuthSessionInput')
    updateAuthSessionInput: UpdateAuthSessionInput,
  ) {
    return this.authSessionsService.update(updateAuthSessionInput.id);
  }

  @Mutation(() => AuthSession)
  removeAuthSession(@Args('id', { type: () => Int }) id: number) {
    return this.authSessionsService.remove(id);
  }
}
