import { checkProjectOwnership } from '../src/routes/Projects';
// Jest imports
import { Request, Response, NextFunction } from 'express';
import * as ProjectsModule from "../src/operations/Projects";
import * as AuthModule from "../src/operations/Authentication";

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    jest,
} from "@jest/globals";

interface CustomRequest extends Request {
    user?: {
        _id: string;
        // Add other user properties as needed
    };
    project?: {
        _id: string;
        // Add other project properties as needed
    };
}

// Mock the entire ProjectsModule
jest.mock("../src/operations/Projects", () => ({
    Projects: {
        getOne: jest.fn(),
    },
}));
jest.mock("../src/operations/Authentication", () => ({
    Authentication: {
        validate: jest.fn(),
    },
}));

describe('checkProjectOwnership', () => {
    let req: Partial<CustomRequest>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            params: {
                id: 'project-id',
            },
            user: {
                _id: 'user-id',
            },
            headers: {
                id_token: 'Bearer <token>',
            },
        } as any;
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as any;
        next = jest.fn() as any;

        // Mocking Projects.getOne and Authentication.validate
        (ProjectsModule.Projects.getOne as jest.Mock).mockResolvedValue({ _id: 'project-id', owner: 'user-id' } as never);
        (AuthModule.Authentication.validate as jest.Mock).mockResolvedValue({ _id: 'user-id' } as never);


    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call next if NODE_ENV is development', async () => {
        process.env.NODE_ENV = 'development';

        await checkProjectOwnership(req, res, next);

        expect(next).toHaveBeenCalled();
    });


    it('should set project if NODE_ENV is test', async () => {
        process.env.NODE_ENV = 'test';
        await checkProjectOwnership(req, res, next);

        expect(next).toHaveBeenCalled();
        expect((req.project as any)._id).toBeDefined();

    });

    it('should not call next if NODE_ENV is test (wrong owner)', async () => {
        process.env.NODE_ENV = 'test';
        (ProjectsModule.Projects.getOne as jest.Mock).mockResolvedValue({ _id: 'project-id', owner: 'wronguser-id' } as never);

        await checkProjectOwnership(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(req.project).not.toBeDefined();
    });
});