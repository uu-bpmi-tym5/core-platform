import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Role } from '../../auth/enums/role.enum';

@Entity()
@ObjectType()
export class User {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String, { description: 'ID of the user' })
  id: string;

  @Column({ unique: true })
  @Field(() => String, { description: 'Email of the user' })
  email: string;

  @Column()
  password: string;

  @Field(() => String, { description: 'Name of the user' })
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.SUPPORTER,
  })
  @Field(() => Role, { description: 'Role of the user' })
  role: Role;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @Field(() => Number, { description: 'Wallet balance of the user' })
  walletBalance: number;
}
