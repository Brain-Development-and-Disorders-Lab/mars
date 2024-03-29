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
        create: jest.fn(),
        addEntity: jest.fn(),
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


    it('should respond with 404 if the project is not found', async () => {
        process.env.NODE_ENV = 'test';
        (ProjectsModule.Projects.getOne as jest.Mock).mockResolvedValue(null as never); // Simulate project not found

        await checkProjectOwnership(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Project not found.' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should respond with 400 if the user is not authenticated/provided', async () => {
        req.user = undefined; // Simulate user not authenticated
        process.env.NODE_ENV = 'test';
        (AuthModule.Authentication.validate as jest.Mock).mockResolvedValue({} as never);


        await checkProjectOwnership(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'User not provided.' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should respond with 401 if token is invalid', async () => {
        process.env.NODE_ENV = 'test';
        req.user = undefined;
        (req.headers as any).id_token = undefined;
        (AuthModule.Authentication.validate as jest.Mock).mockResolvedValue(null as never); // Simulate invalid token

        await checkProjectOwnership(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'No token provided.' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should proceed with valid token and project ID from body', async () => {
        req.user = undefined; // Simulate user not authenticated via req.user
        req.body = { project: 'project-id-from-body' }; // Simulate passing project ID in the body
        process.env.NODE_ENV = 'test';

        await checkProjectOwnership(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.project).toBeDefined();
    });

    it('should allow access for a collaborator', async () => {
        process.env.NODE_ENV = 'test';
        const collaboratorId = 'collaborator-id';
        req.user = { _id: collaboratorId };

        // Mock project with collaborator
        (ProjectsModule.Projects.getOne as jest.Mock).mockResolvedValue({ 
            _id: 'project-id', 
            owner: 'user-id', 
            collaborators: [collaboratorId] 
        } as never);

        await checkProjectOwnership(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.project).toBeDefined();
    });

    it('should deny access for non-collaborators and non-owners', async () => {
        process.env.NODE_ENV = 'test';
        req.user = { _id: 'non-collaborator-id' };

        // Mock project without the non-collaborator
        (ProjectsModule.Projects.getOne as jest.Mock).mockResolvedValue({ 
            _id: 'project-id', 
            owner: 'user-id', 
            collaborators: ['collaborator-id'] 
        } as never);

        await checkProjectOwnership(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'User is not the owner nor collaborator of this project.' });
    });
});