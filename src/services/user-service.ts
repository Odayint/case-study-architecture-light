import { inject, injectable } from 'inversify';
import { PasswordManagerService } from './password-manager-service';
import { UserRepository } from '../repositories/user-repository';
import { TYPES } from '../lib/types';
import { User } from '../entities/user';
import { sign, Secret, SignOptions } from 'jsonwebtoken';

export interface UserService {
    register(email: string, password: string, firstName: string, lastName: string): Promise<{ token: string; user: User }>;
    login(email: string, password: string): Promise<{ token: string; user: User }>;
}

@injectable()
export class UserServiceImpl implements UserService {
    constructor(
        @inject(TYPES.PasswordManagerService) private passwordManager: PasswordManagerService,
        @inject(TYPES.UserRepository) private userRepository: UserRepository,
    ) {}

    async register(
        email: string,
        password: string,
        firstName: string,
        lastName: string,
    ): Promise<{ token: string; user: User }> {
        this.validateEmail(email);
        this.validatePassword(password);

        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error('Email already registered');
        }

        const passwordHash = await this.passwordManager.toHash(password);

        const user = await this.userRepository.create({
            email,
            passwordHash,
            firstName,
            lastName,
        });

        const token = this.generateToken(user);

        return { token, user };
    }

    async login(email: string, password: string): Promise<{ token: string; user: User }> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValidPassword = await this.passwordManager.compare(user.passwordHash, password);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        const token = this.generateToken(user);

        return { token, user };
    }

    private validateEmail(email: string): void {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }
    }

    private validatePassword(password: string): void {
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            throw new Error('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            throw new Error('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            throw new Error('Password must contain at least one number');
        }
    }

    private generateToken(user: User): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    const options: SignOptions = {
        expiresIn: '24h',
    };

    return sign(
        {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        },
        secret,
        options,
    );
}
}
