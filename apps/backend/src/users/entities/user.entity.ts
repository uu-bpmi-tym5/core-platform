import { ObjectType, Field } from '@nestjs/graphql';
import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
@ObjectType()
export class User {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String, { description: 'ID of the user' })
  id: string;

  @Column({unique: true})
  @Field(() => String, { description: 'Email of the user' })
  email: string;

  @Column()
  password: string;

  @Field(() => String, { description: 'Name of the user' })
  @Column()
  name: string;
}
