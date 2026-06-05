import 'reflect-metadata';
import { json } from 'body-parser';
import request from 'supertest';
import { Container } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';

import { TYPES } from '../lib/types';
import { UserService } from '../services/user-service';
import '../controllers/user-controller';
import '../lib/base-controller';

const createApp = (userServiceMock: UserService) => {
    const container = new Container();
    container.bind<UserService>(TYPES.UserService).toConstantValue(userServiceMock);

    const server = new InversifyExpressServer(container, null, {
        rootPath: '/partner-app/api',
    });

    server.setConfig(app => {
        app.use(json());
    });

    return server.build();
};

describe('UserController', () => {
    const exampleUser = {
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date(),
    };

    const userServiceMock: UserService = {
        register: jest.fn(),
        login: jest.fn(),
    } as unknown as UserService;

    let app: ReturnType<typeof createApp>;

    beforeEach(() => {
        jest.clearAllMocks();
        app = createApp(userServiceMock);
    });

    it('registers a user successfully', async () => {
        (userServiceMock.register as jest.Mock).mockResolvedValue({
            token: 'signed-token',
            user: exampleUser,
        });

        const response = await request(app)
            .post('/partner-app/api/users/register')
            .send({
                email: 'test@example.com',
                password: 'StrongPass1',
                firstName: 'Test',
                lastName: 'User',
            });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            message: 'User registered successfully',
            token: 'signed-token',
            user: {
                id: 'user-id',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
            },
        });
        expect(userServiceMock.register).toHaveBeenCalledWith(
            'test@example.com',
            'StrongPass1',
            'Test',
            'User',
        );
    });

    it('logs in a user successfully', async () => {
        (userServiceMock.login as jest.Mock).mockResolvedValue({
            token: 'signed-token',
            user: exampleUser,
        });

        const response = await request(app)
            .post('/partner-app/api/users/login')
            .send({
                email: 'test@example.com',
                password: 'StrongPass1',
            });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            message: 'Login successful',
            token: 'signed-token',
            user: {
                id: 'user-id',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
            },
        });
        expect(userServiceMock.login).toHaveBeenCalledWith('test@example.com', 'StrongPass1');
    });

    it('returns 400 when register payload is missing fields', async () => {
        const response = await request(app)
            .post('/partner-app/api/users/register')
            .send({ email: 'test@example.com', password: 'StrongPass1' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Missing required fields: email, password, firstName, lastName',
        });
    });

    it('rejects duplicate email on register', async () => {
        (userServiceMock.register as jest.Mock).mockRejectedValue(new Error('Email already registered'));

        const response = await request(app)
            .post('/partner-app/api/users/register')
            .send({
                email: 'test@example.com',
                password: 'StrongPass1',
                firstName: 'Test',
                lastName: 'User',
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Email already registered',
        });
    });

    it('returns 401 when login fails', async () => {
        (userServiceMock.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

        const response = await request(app)
            .post('/partner-app/api/users/login')
            .send({ email: 'test@example.com', password: 'WrongPass1' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Invalid credentials',
        });
    });
});
