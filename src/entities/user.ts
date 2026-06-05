import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column({ select: false })
    passwordHash!: string;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt!: Date;
}
