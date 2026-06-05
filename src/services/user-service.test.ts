import 'reflect-metadata';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
import { UserServiceImpl } from './user-service';
import { User } from '../entities/user';
import { sign } from 'jsonwebtoken';

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('signed-token'),
}));

describe('UserServiceImpl', () => {
    const passwordManagerMock = {
        toHash: jest.fn<Promise<string>, [string]>(),
        compare: jest.fn<Promise<boolean>, [string, string]>(),
    };

    const userRepositoryMock = {
        findByEmail: jest.fn<Promise<User | null>, [string]>(),
        create: jest.fn<Promise<User>, [Partial<User>]>(),
        save: jest.fn<Promise<User>, [User]>(),
    };

    const service = new UserServiceImpl(
        passwordManagerMock as any,
        userRepositoryMock as any,
    );

    const exampleUser: User = {
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('creates user', async () => {
            passwordManagerMock.toHash.mockResolvedValue('hashed-password');
            userRepositoryMock.findByEmail.mockResolvedValue(null);
            userRepositoryMock.create.mockResolvedValue(exampleUser);

            const result = await service.register(
                'test@example.com',
                'StrongPass1',
                'Test',
                'User',
            );

            expect(passwordManagerMock.toHash).toHaveBeenCalledWith('StrongPass1');
            expect(userRepositoryMock.create).toHaveBeenCalledWith({
                email: 'test@example.com',
                passwordHash: 'hashed-password',
                firstName: 'Test',
                lastName: 'User',
            });
            expect(result.token).toBe('signed-token');
            expect(result.user).toBe(exampleUser);
        });

        it('rejects duplicate email', async () => {
            userRepositoryMock.findByEmail.mockResolvedValue(exampleUser);

            await expect(
                service.register('test@example.com', 'StrongPass1', 'Test', 'User'),
            ).rejects.toThrow('Email already registered');
        });

        const invalidPasswords = [
            { password: 'password', expectedError: 'Password must contain at least one uppercase letter' },
            { password: 'Password', expectedError: 'Password must contain at least one number' },
            { password: 'PASSWORD123', expectedError: 'Password must contain at least one lowercase letter' },
            { password: 'password123', expectedError: 'Password must contain at least one uppercase letter' },
            { password: 'Pass1', expectedError: 'Password must be at least 8 characters long' },
        ];

        invalidPasswords.forEach(({ password, expectedError }) => {
            it(`rejects weak password '${password}'`, async () => {
                await expect(
                    service.register('test@example.com', password, 'Test', 'User'),
                ).rejects.toThrow(expectedError);
            });
        });

        it('accepts a strong password', async () => {
            passwordManagerMock.toHash.mockResolvedValue('hashed-password');
            userRepositoryMock.findByEmail.mockResolvedValue(null);
            userRepositoryMock.create.mockResolvedValue(exampleUser);

            const result = await service.register(
                'test@example.com',
                'Password123',
                'Test',
                'User',
            );

            expect(result.token).toBe('signed-token');
            expect(passwordManagerMock.toHash).toHaveBeenCalledWith('Password123');
            expect(userRepositoryMock.create).toHaveBeenCalledWith({
                email: 'test@example.com',
                passwordHash: 'hashed-password',
                firstName: 'Test',
                lastName: 'User',
            });
        });
    });

    describe('login', () => {
        it('returns token', async () => {
            userRepositoryMock.findByEmail.mockResolvedValue(exampleUser);
            passwordManagerMock.compare.mockResolvedValue(true);

            const result = await service.login('test@example.com', 'StrongPass1');

            expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(passwordManagerMock.compare).toHaveBeenCalledWith('hashed-password', 'StrongPass1');
            expect(result.token).toBe('signed-token');
            expect(result.user).toBe(exampleUser);
        });

        it('invalid email', async () => {
            userRepositoryMock.findByEmail.mockResolvedValue(null);

            await expect(service.login('notfound@example.com', 'StrongPass1')).rejects.toThrow(
                'Invalid credentials',
            );
        });

        it('invalid password', async () => {
            userRepositoryMock.findByEmail.mockResolvedValue(exampleUser);
            passwordManagerMock.compare.mockResolvedValue(false);

            await expect(service.login('test@example.com', 'WrongPass1')).rejects.toThrow(
                'Invalid credentials',
            );
        });
    });
});
