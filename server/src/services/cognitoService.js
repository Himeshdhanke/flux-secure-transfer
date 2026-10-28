const crypto = require('crypto');
const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
  InitiateAuthCommand,
  AdminGetUserCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const config = require('../config/env');
const logger = require('../utils/logger');
const { UnauthorizedError, ValidationError } = require('../utils/errors');

/**
 * AWS Cognito Service
 * Manages zero-trust user authentication and user pool operations in AWS Sydney (ap-southeast-2).
 */
class CognitoService {
  constructor() {
    this.userPoolId = config.aws.cognito.userPoolId;
    this.clientId = config.aws.cognito.clientId;
    this.clientSecret = config.aws.cognito.clientSecret;
    this.region = config.aws.region || 'ap-southeast-2';
    this.client = null;

    if (this.isConfigured()) {
      this._initClient();
      logger.info('[AUTH] AWS Cognito Identity Provider Service initialized', {
        userPoolId: this.userPoolId,
        clientId: this.clientId,
        hasClientSecret: Boolean(this.clientSecret),
        region: this.region,
      });
    }
  }

  isConfigured() {
    return Boolean(this.userPoolId && this.clientId);
  }

  _computeSecretHash(username) {
    if (!this.clientSecret) return undefined;
    return crypto
      .createHmac('sha256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }

  _initClient() {
    const clientConfig = { region: this.region };
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      };
    }
    this.client = new CognitoIdentityProviderClient(clientConfig);
  }

  /**
   * Register a user in the AWS Cognito User Pool
   */
  async registerUser({ email, password, name }) {
    if (!this.isConfigured()) {
      return null;
    }
    if (!this.client) this._initClient();

    try {
      const secretHash = this._computeSecretHash(email);
      const signUpParams = {
        ClientId: this.clientId,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'name', Value: name || email.split('@')[0] },
        ],
      };
      if (secretHash) {
        signUpParams.SecretHash = secretHash;
      }

      // 1. Sign up user in Cognito
      const signUpRes = await this.client.send(new SignUpCommand(signUpParams));
      const cognitoSub = signUpRes.UserSub;

      // 2. Pre-confirm user account so they can sign in immediately
      try {
        await this.client.send(new AdminConfirmSignUpCommand({
          UserPoolId: this.userPoolId,
          Username: email,
        }));
      } catch (confirmErr) {
        logger.warn('Admin confirmation skipped or already confirmed:', { error: confirmErr.message });
      }

      logger.info('User registered in AWS Cognito User Pool', { email, cognitoSub });
      return { cognitoSub, email, name: name || '' };
    } catch (err) {
      if (err.name === 'UsernameExistsException') {
        throw new ValidationError('An account with this email address already exists in Cognito.');
      }
      logger.error('Failed to register user in Cognito', { error: err.message, name: err.name });
      throw new ValidationError(`AWS Cognito registration failed: ${err.message}`);
    }
  }

  /**
   * Authenticate a user against AWS Cognito and retrieve live JWT tokens
   */
  async authenticateUser({ email, password }) {
    if (!this.isConfigured()) {
      return null;
    }
    if (!this.client) this._initClient();

    try {
      const secretHash = this._computeSecretHash(email);
      const authParameters = {
        USERNAME: email,
        PASSWORD: password,
      };
      if (secretHash) {
        authParameters.SECRET_HASH = secretHash;
      }

      const authCommand = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: authParameters,
      });

      const authRes = await this.client.send(authCommand);
      if (!authRes.AuthenticationResult) {
        throw new UnauthorizedError('Cognito authentication challenge required.');
      }

      const { IdToken, AccessToken, RefreshToken, ExpiresIn } = authRes.AuthenticationResult;

      // Decode payload claims from IdToken
      let cognitoSub = '';
      let userName = '';
      try {
        const payloadBase64 = IdToken.split('.')[1];
        const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
        const payload = JSON.parse(payloadJson);
        cognitoSub = payload.sub;
        userName = payload.name || '';
      } catch (e) {
        logger.warn('Could not parse IdToken payload, falling back to AdminGetUser', { error: e.message });
      }

      logger.info('User authenticated via AWS Cognito in Sydney', { email, cognitoSub });

      return {
        idToken: IdToken,
        accessToken: AccessToken,
        refreshToken: RefreshToken,
        token: IdToken, // Primary JWT for bearer authorization
        expiresIn: ExpiresIn,
        cognitoSub,
        email,
        name: userName,
      };
    } catch (err) {
      if (err.name === 'NotAuthorizedException' || err.name === 'UserNotFoundException') {
        throw new UnauthorizedError('Invalid email or password.');
      }
      logger.error('Cognito authentication failed', { error: err.message, name: err.name });
      throw new UnauthorizedError(`AWS Cognito authentication failed: ${err.message}`);
    }
  }
}

module.exports = new CognitoService();
