import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {User} from "../../users/entities/user.entity";
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity({name: 'auth_session'})
export class Session {
    @Field(() => ID)
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field(() => User)
    @ManyToOne(() => User, {nullable: false})
    user: User

    @Field()
    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    createdAt: Date;

    @Field()
    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    lastSeenAt: Date;

    @Field()
    @Column({type: 'timestamp'})
    expiresAt: Date;

    @Field(() => Date, { nullable: true })
    @Column({type: 'timestamp', nullable: true})
    revokedAt?: Date | null;
}
