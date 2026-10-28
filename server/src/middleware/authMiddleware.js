const { CognitoJwtVerifier } = require('aws-jwt-verify');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const { UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

// Initialize Cognito JWT Verifier if User Pool is configured
let cognitoVerifier = null;
if (config.aws.cognito.userPoolId && config.aws.cognito.clientId) {
  try {
    cognitoVerifier = CognitoJwtVerifier.create({
      userPoolId: config.aws.cognito.userPoolId,
      tokenUse: null, // Accepts both ID and Access tokens
      clientId: config.aws.cognito.clientId,
    });
    if (cognitoVerifier.jwksCache && cognitoVerifier.jwksCache.fetcher && cognitoVerifier.jwksCache.fetcher.defaultRequestOptions) {
      cognitoVerifier.jwksCache.fetcher.defaultRequestOptions.responseTimeout = 10000;
    }
    cognitoVerifier.hydrate().catch(e => {
      logger.warn('[AUTH WARNING] Background JWKS hydrate deferred:', { error: e.message });
    });
    logger.info('[AUTH] AWS Cognito JWT verifier initialized', {
      userPoolId: config.aws.cognito.userPoolId,
    });
  } catch (err) {
    logger.warn('[AUTH WARNING] Failed to initialize Cognito verifier:', { error: err.message });
  }
}

/**
 * Authentication Middleware
 * Validates Cognito ID/Access JWT tokens against Cognito JWKS,
 * or verifies local development JWTs if in local development mode.
 * Attaches the verified user identity to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header. Expected Bearer token.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Authentication token missing.');
    }

    let verifiedUser = null;

    // Check if Cognito is configured
    if (cognitoVerifier) {
      try {
        const payload = await cognitoVerifier.verify(token);
        // Verified by AWS Cognito JWKS
        const cognitoSub = payload.sub;
        const email = (payload.email || payload.username || '').toLowerCase().trim();

        // Upsert user record for local reference
        let user = await User.findOne({ cognitoSub });
        if (!user && email) {
          user = await User.create({
            cognitoSub,
            email,
            emailVerified: payload.email_verified || true,
            authProvider: 'cognito',
          });
        }

        verifiedUser = {
          cognitoSub,
          email: user ? user.email : email,
          emailVerified: user ? user.emailVerified : true,
          name: user ? user.name : '',
          authProvider: 'cognito',
        };
      } catch (cognitoErr) {
        logger.warn('Cognito JWT verification failed, attempting local fallback check', {
          error: cognitoErr.message,
        });
      }
    }

    // If Cognito did not verify or is not configured, check local JWT (for local development)
    if (!verifiedUser) {
      try {
        const decoded = jwt.verify(token, config.localJwtSecret);
        const user = await User.findOne({ cognitoSub: decoded.sub || decoded.cognitoSub });
        if (!user || !user.enabled) {
          throw new UnauthorizedError('User account not found or disabled.');
        }

        verifiedUser = {
          cognitoSub: user.cognitoSub,
          email: user.email,
          emailVerified: user.emailVerified,
          name: user.name,
          authProvider: user.authProvider,
        };
      } catch (localErr) {
        throw new UnauthorizedError('Invalid or expired authentication token.');
      }
    }

    req.user = verifiedUser;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional Authentication: Attaches req.user if a valid token is present, but does not block.
 */
async function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return authenticate(req, res, (err) => {
    // Ignore error for optional authentication
    next();
  });
}

module.exports = {
  authenticate,
  optionalAuthenticate,
};
