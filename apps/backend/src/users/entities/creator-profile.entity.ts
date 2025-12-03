import { ObjectType, Field } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Profile } from './profile.entity';

@Entity()
@ObjectType()
export class CreatorProfile {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String, { description: 'ID of the creator profile' })
  id: string;

  @OneToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profileId' })
  profile: Profile;

  @Column({ unique: true })
  @Field(() => String, { description: 'ID of the profile this creator profile is associated with' })
  profileId: string;

  @Column({ default: false })
  @Field(() => Boolean, { description: 'Whether this profile is publicly visible as a creator' })
  isPublic: boolean;

  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true, description: 'Longer creator-specific bio or story' })
  creatorBio: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Field(() => String, { nullable: true, description: 'Primary category or focus area for this creator' })
  primaryCategory: string | null;

  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true, description: 'Additional public information or highlights' })
  highlights: string | null;

  // Private-only fields intentionally not exposed to GraphQL
  @Column({ type: 'jsonb', nullable: true })
  privateMetadata: Record<string, unknown> | null;

  @CreateDateColumn()
  @Field(() => Date, { description: 'Creation date of the creator profile' })
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date, { description: 'Last update date of the creator profile' })
  updatedAt: Date;
}
