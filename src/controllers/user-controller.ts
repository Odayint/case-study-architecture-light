import { Request, Response } from 'express';
import { inject } from 'inversify';
import {
    controller,
    httpPost,
    request,
    response,
} from 'inversify-express-utils';
import { UserService } from '../services/user-service';
import { TYPES } from '../lib/types';
import { BaseController } from '../lib/base-controller';

@controller('/users')
export class UserController extends BaseController {
    constructor(@inject(TYPES.UserService) private userService: UserService) {
        super();
    }

    @httpPost('/register')
    async register(@request() req: Request, @response() res: Response) {
        try {
            const { email, password, firstName, lastName } = req.body;

            if (!email || !password || !firstName || !lastName) {
                return res.status(400).json({
                    error: 'Missing required fields: email, password, firstName, lastName',
                });
            }

            const result = await this.userService.register(email, password, firstName, lastName);

            return res.status(201).json({
                message: 'User registered successfully',
                token: result.token,
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                },
            });
        } catch (error: any) {
            return res.status(400).json({
                error: error.message || 'Registration failed',
            });
        }
    }

    @httpPost('/login')
    async login(@request() req: Request, @response() res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    error: 'Missing required fields: email, password',
                });
            }

            const result = await this.userService.login(email, password);

            return res.status(200).json({
                message: 'Login successful',
                token: result.token,
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                },
            });
        } catch (error: any) {
            return res.status(401).json({
                error: error.message || 'Authentication failed',
            });
        }
    }
}

