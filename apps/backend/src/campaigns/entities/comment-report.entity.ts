import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Comment } from './comment.entity';

@Entity()
@Unique(['userId', 'commentId']) //jeden uživatel nemůže mít více reportů na jeden komentář
@ObjectType()
export class CommentReport {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String)
  id: string;

  @Column()
  @Field(() => String)
  userId: string;

  @Column()
  @Field(() => String)
  commentId: string;

  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Comment)
  @JoinColumn({ name: 'commentId' })
  comment: Comment;
}