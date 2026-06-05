import 'reflect-metadata';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
import { json } from 'body-parser';
import request from 'supertest';
import { Container } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';

import '../controllers/user-controller';
import '../lib/base-controller';
import { TYPES } from '../lib/types';
import { UserServiceImpl } from '../services/user-service';
import { PasswordManagerServiceImpl, PasswordManagerService } from '../services/password-manager-service';
import { UserRepository } from '../repositories';
import { User } from '../entities/user';
import { UserService } from '../services/user-service';

class InMemoryUserRepository implements UserRepository {
    private users: User[] = [];

    async findByEmail(email: string): Promise<User | null> {
        const user = this.users.find(item => item.email === email);
        return user ?? null;
    }

    async create(user: Partial<User>): Promise<User> {
        const newUser: User = {
            id: crypto.randomUUID(),
            email: user.email!,
            firstName: user.firstName!,
            lastName: user.lastName!,
            passwordHash: user.passwordHash!,
            createdAt: new Date(),
        };
        this.users.push(newUser);
        return newUser;
    }

    async save(user: User): Promise<User> {
        const index = this.users.findIndex(item => item.id === user.id);
        if (index >= 0) {
            this.users[index] = user;
        } else {
            this.users.push(user);
        }
        return user;
    }
}

const createApp = () => {
    const container = new Container();

    container.bind<UserRepository>(TYPES.UserRepository).toConstantValue(new InMemoryUserRepository());
    container.bind<PasswordManagerService>(TYPES.PasswordManagerService).to(PasswordManagerServiceImpl);
    container.bind<UserService>(TYPES.UserService).to(UserServiceImpl);

    const server = new InversifyExpressServer(container, null, {
        rootPath: '/partner-app/api',
    });

    server.setConfig(app => {
        app.use(json());
    });

    return server.build();
};

describe('User authentication integration', () => {
    let app: ReturnType<typeof createApp>;

    beforeEach(() => {
        app = createApp();
    });

    it('registers a new user and returns a JWT token', async () => {
        const response = await request(app)
            .post('/partner-app/api/users/register')
            .send({
                email: 'integration@example.com',
                password: 'StrongPass1',
                firstName: 'Integration',
                lastName: 'Tester',
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('token');
        expect(response.body.user).toMatchObject({
            email: 'integration@example.com',
            firstName: 'Integration',
            lastName: 'Tester',
        });
    });

    it('logs in an existing user after registration', async () => {
        await request(app)
            .post('/partner-app/api/users/register')
            .send({
                email: 'integration@example.com',
                password: 'StrongPass1',
                firstName: 'Integration',
                lastName: 'Tester',
            })
            .expect(201);

        const response = await request(app)
            .post('/partner-app/api/users/login')
            .send({
                email: 'integration@example.com',
                password: 'StrongPass1',
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body.user).toMatchObject({
            email: 'integration@example.com',
            firstName: 'Integration',
            lastName: 'Tester',
        });
    });

    it('rejects login with wrong email and returns generic invalid credentials', async () => {
        await request(app)
            .post('/partner-app/api/users/register')
            .send({
                email: 'integration@example.com',
                password: 'StrongPass1',
                firstName: 'Integration',
                lastName: 'Tester',
            })
            .expect(201);

        const response = await request(app)
            .post('/partner-app/api/users/login')
            .send({
                email: 'wrong@example.com',
                password: 'StrongPass1',
            });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: 'Invalid credentials' });
    });

    it('rejects login with wrong password and returns generic invalid credentials', async () => {
        await request(app)
            .post('/partner-app/api/users/register')
            .send({
                email: 'integration@example.com',
                password: 'StrongPass1',
                firstName: 'Integration',
                lastName: 'Tester',
            })
            .expect(201);

        const response = await request(app)
            .post('/partner-app/api/users/login')
            .send({
                email: 'integration@example.com',
                password: 'WrongPass1',
            });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: 'Invalid credentials' });
    });
});
