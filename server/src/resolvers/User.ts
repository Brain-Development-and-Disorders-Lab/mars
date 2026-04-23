import { IResolverParent, IResponseMessage, ResponseData, UserModel } from "@types";

// Models
import { User } from "@models/User";

// Email
import { sendEmail, templates } from "@lib/email";

export const UserResolvers = {
  Query: {
    // Retrieve all Users
    users: async () => {
      return await User.all();
    },

    // Retrieve one User by _id
    user: async (_parent: IResolverParent, args: { _id: string }): Promise<UserModel | null> => {
      return await User.getOne(args._id);
    },

    // Retrieve one User by email
    userByEmail: async (_parent: IResolverParent, args: { email: string }): Promise<ResponseData<string>> => {
      return await User.getByEmail(args.email);
    },

    // Retrieve one User by ORCiD
    userByOrcid: async (_parent: IResolverParent, args: { orcid: string }): Promise<ResponseData<string>> => {
      return await User.getByOrcid(args.orcid);
    },
  },
  Mutation: {
    // Create a User
    createUser: async (_parent: IResolverParent, args: { user: UserModel }): Promise<IResponseMessage> => {
      return await User.create(args.user);
    },

    // Update a User
    updateUser: async (_parent: IResolverParent, args: { user: UserModel }): Promise<IResponseMessage> => {
      return await User.update(args.user);
    },

    // Send a report issue email to the admin
    reportIssue: async (
      _parent: IResolverParent,
      args: {
        description: string;
        path: string;
        userName: string;
        userId: string;
        userEmail: string;
        consoleErrors: string[];
      },
    ): Promise<IResponseMessage> => {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail) {
        return { success: false, message: "ADMIN_EMAIL is not configured" };
      }
      const timestamp = new Date().toUTCString();
      await sendEmail({
        to: adminEmail,
        subject: "Issue Report — Metadatify",
        html: templates.reportIssue({
          description: args.description,
          path: args.path,
          userName: args.userName,
          userId: args.userId,
          userEmail: args.userEmail,
          consoleErrors: args.consoleErrors ?? [],
          timestamp,
        }),
      });
      return { success: true, message: "Report submitted" };
    },
  },
};
