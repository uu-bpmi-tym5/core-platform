import { InputType, Field, ID, registerEnumType } from '@nestjs/graphql';

//pravomoce moderatora
export enum ModerationAction {
  HIDE = 'HIDE',
  REMOVE = 'REMOVE',
  RESTORE = 'RESTORE',
}

registerEnumType(ModerationAction, {
  name: 'ModerationAction',
  description: 'Možnosti moderatora pro správu komentářů',
});

@InputType()
export class ReportCommentInput {
  @Field(() => ID)
  commentId: string;

  @Field(() => String, { nullable: true })
  reason?: string;
}

@InputType()
export class ModerateCommentInput {
  @Field(() => ID)
  commentId: string;

  @Field(() => ModerationAction)
  action: ModerationAction;

  @Field(() => String, { nullable: true })
  reason?: string;
}

@InputType()
export class DeleteMyCommentInput {
  @Field(() => ID)
  commentId: string;
}