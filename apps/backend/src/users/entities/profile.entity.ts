import { ObjectType, Field } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
@ObjectType()
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String, { description: 'ID of the profile' })
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true })
  @Field(() => String, { description: 'ID of the user that owns this profile' })
  userId: string;

  @Column({ unique: true })
  @Field(() => String, { description: 'Public slug used in profile URLs' })
  slug: string;

  @Column()
  @Field(() => String, { description: 'Display name shown on the profile' })
  displayName: string;


  @Column({ type: 'varchar', nullable: true })
  @Field(() => String, { nullable: true, description: 'Avatar image URL' })
  avatarUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Field(() => String, { nullable: true, description: 'Location of the user' })
  location: string | null;


  @Column({ type: 'jsonb', nullable: true })
  @Field(() => String, { nullable: true, description: 'Optional JSON blob with social links' })
  socialLinks: Record<string, string> | null;

  @CreateDateColumn()
  @Field(() => Date, { description: 'Creation date of the profile' })
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date, { description: 'Last update date of the profile' })
  updatedAt: Date;
}
