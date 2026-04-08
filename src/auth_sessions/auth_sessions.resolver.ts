import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AuthSessionsService } from './auth_sessions.service';
import { AuthSession } from './entities/auth_session.entity';
import { CreateAuthSessionInput } from './dto/create-auth_session.input';
import { UpdateAuthSessionInput } from './dto/update-auth_session.input';

@Resolver(() => AuthSession)
export class AuthSessionsResolver {
  constructor(private readonly authSessionsService: AuthSessionsService) {}

  @Mutation(() => AuthSession)
  createAuthSession(@Args('createAuthSessionInput') createAuthSessionInput: CreateAuthSessionInput) {
    return this.authSessionsService.create(createAuthSessionInput);
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
  updateAuthSession(@Args('updateAuthSessionInput') updateAuthSessionInput: UpdateAuthSessionInput) {
    return this.authSessionsService.update(updateAuthSessionInput.id, updateAuthSessionInput);
  }

  @Mutation(() => AuthSession)
  removeAuthSession(@Args('id', { type: () => Int }) id: number) {
    return this.authSessionsService.remove(id);
  }
}
