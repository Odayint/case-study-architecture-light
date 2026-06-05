import { inject, injectable } from 'inversify';
import { DataSource } from 'typeorm';
import { User } from '../entities/user';
import { TYPES } from '../lib/types';

export interface UserRepository {
    findByEmail(email: string): Promise<User | null>;
    create(user: Partial<User>): Promise<User>;
    save(user: User): Promise<User>;
}

@injectable()
export class UserRepositoryImpl implements UserRepository {
    constructor(@inject(TYPES.DB) private dataSource: DataSource) {}

    async findByEmail(email: string): Promise<User | null> {
        const userRepository = this.dataSource.getRepository(User);
        return userRepository
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .where('user.email = :email', { email })
            .getOne();
    }

    async create(user: Partial<User>): Promise<User> {
        const userRepository = this.dataSource.getRepository(User);
        const newUser = userRepository.create(user);
        return userRepository.save(newUser);
    }

    async save(user: User): Promise<User> {
        const userRepository = this.dataSource.getRepository(User);
        return userRepository.save(user);
    }
}
