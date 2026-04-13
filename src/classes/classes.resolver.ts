import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ClassesService } from './classes.service';
import { Class } from './entities/class.entity';
import { CreateClassInput } from './dto/create-class.input';
import { UpdateClassInput } from './dto/update-class.input';

@Resolver(() => Class)
export class ClassesResolver {
  constructor(private readonly classesService: ClassesService) {}

  @Mutation(() => Class)
  createClass(@Args('createClassInput') createClassInput: CreateClassInput) {
    return this.classesService.create(createClassInput);
  }

  @Query(() => [Class], { name: 'classes' })
  findAll() {
    return this.classesService.findAll();
  }

  @Query(() => Class, { name: 'class' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.classesService.findOne(id);
  }

  @Mutation(() => Class)
  updateClass(@Args('updateClassInput') updateClassInput: UpdateClassInput) {
    return this.classesService.update(updateClassInput.id, updateClassInput);
  }

  @Mutation(() => Class)
  removeClass(@Args('id', { type: () => Int }) id: number) {
    return this.classesService.remove(id);
  }
}
