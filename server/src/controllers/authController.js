const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const cognitoService = require('../services/cognitoService');
const { ValidationError, UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

class AuthController {
  /**
   * Register a user (AWS Cognito User Pool or local fallback)
   */
  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      // 1. If AWS Cognito is configured, register user in Cognito User Pool
      if (cognitoService.isConfigured()) {
        const cognitoResult = await cognitoService.registerUser({
          email: normalizedEmail,
          password,
          name,
        });

        // Upsert local user record
        let user = await User.findOne({ cognitoSub: cognitoResult.cognitoSub });
        if (!user) {
          user = await User.create({
            cognitoSub: cognitoResult.cognitoSub,
            email: normalizedEmail,
            name: name || '',
            emailVerified: true,
            enabled: true,
            authProvider: 'cognito',
          });
        }

        // Authenticate directly to obtain Cognito tokens
        const authData = await cognitoService.authenticateUser({
          email: normalizedEmail,
          password,
        });

        return res.status(201).json({
          success: true,
          message: 'Account created successfully in AWS Cognito.',
          data: {
            token: authData.token,
            user: {
              cognitoSub: user.cognitoSub,
              email: user.email,
              name: user.name,
              emailVerified: true,
              authProvider: 'cognito',
            },
          },
        });
      }

      // 2. Local fallback registration
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        throw new ValidationError('An account with this email address already exists.');
      }

      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);
      const cognitoSub = `usr_${crypto.randomUUID()}`;

      const user = await User.create({
        cognitoSub,
        email: normalizedEmail,
        name: name || '',
        emailVerified: true,
        enabled: true,
        passwordHash,
        authProvider: 'local',
      });

      const token = jwt.sign(
        {
          sub: user.cognitoSub,
          email: user.email,
          name: user.name,
          email_verified: user.emailVerified,
        },
        config.localJwtSecret,
        { expiresIn: '7d' }
      );

      logger.info('User registered successfully (local)', { email: normalizedEmail, sub: cognitoSub });

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        data: {
          token,
          user: {
            cognitoSub: user.cognitoSub,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
            authProvider: user.authProvider,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Login user (AWS Cognito authentication or local fallback)
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      // 1. If AWS Cognito is configured, authenticate via Cognito
      if (cognitoService.isConfigured()) {
        const cognitoAuth = await cognitoService.authenticateUser({
          email: normalizedEmail,
          password,
        });

        // Sync local user record
        let user = await User.findOne({ cognitoSub: cognitoAuth.cognitoSub });
        if (!user) {
          user = await User.create({
            cognitoSub: cognitoAuth.cognitoSub,
            email: normalizedEmail,
            name: cognitoAuth.name || '',
            emailVerified: true,
            enabled: true,
            authProvider: 'cognito',
          });
        }

        return res.json({
          success: true,
          message: 'Logged in successfully via AWS Cognito.',
          data: {
            token: cognitoAuth.token,
            user: {
              cognitoSub: user.cognitoSub,
              email: user.email,
              name: user.name,
              emailVerified: true,
              authProvider: 'cognito',
            },
          },
        });
      }

      // 2. Local fallback login
      const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
      if (!user || !user.passwordHash) {
        throw new UnauthorizedError('Invalid email or password.');
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedError('Invalid email or password.');
      }

      if (!user.enabled) {
        throw new UnauthorizedError('This account has been deactivated.');
      }

      const token = jwt.sign(
        {
          sub: user.cognitoSub,
          email: user.email,
          name: user.name,
          email_verified: user.emailVerified,
        },
        config.localJwtSecret,
        { expiresIn: '7d' }
      );

      logger.info('User logged in successfully (local)', { email: normalizedEmail, sub: user.cognitoSub });

      res.json({
        success: true,
        message: 'Logged in successfully.',
        data: {
          token,
          user: {
            cognitoSub: user.cognitoSub,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
            authProvider: user.authProvider,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get current authenticated user details
   */
  async getMe(req, res, next) {
    try {
      res.json({
        success: true,
        data: {
          user: req.user,
          awsCognitoConfigured: Boolean(config.aws.cognito.userPoolId),
          storageMode: config.storageMode,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Logout
   */
  async logout(req, res) {
    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  }
}

module.exports = new AuthController();
