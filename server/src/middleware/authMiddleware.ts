// src/middleware/authMiddleware.js

import consola from 'consola';
import { Authentication } from 'src/operations/Authentication';

const authMiddleware = async (req, res, next) => {
  try {
    // Extract the token from the request header
    const token = req.headers['id_token']; // Bearer <token>
    if (!token) {
      return res.status(401).json({ message: 'No token provided.' });
    }

    // Validate the token
    const isUser = await Authentication.validate(token);
    if (!isUser) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    // If token is valid, you might want to fetch user details or permissions
    // and attach them to the request object for further use in the endpoint logic
    // e.g., req.user = userDetails;
    req.user = isUser;
    // Proceed to the next middleware/function in the stack
    next();
  } catch (error) {
    consola.error('Authentication Middleware Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export default authMiddleware;
