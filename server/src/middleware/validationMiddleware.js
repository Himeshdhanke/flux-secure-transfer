const { z } = require('zod');
const { ValidationError } = require('../utils/errors');

function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const details = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new ValidationError('Request validation failed', details));
      }
      next(err);
    }
  };
}

// Schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(100),
  name: z.string().min(1, 'Name is required').max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const createShareSchema = z.object({
  recipientEmail: z.string().email('Invalid recipient email address'),
  expiryHours: z.coerce.number().min(1, 'Expiry must be at least 1 hour').max(720, 'Expiry cannot exceed 30 days').default(24),
  maxViewSessions: z.coerce.number().min(1).nullable().optional(),
});

module.exports = {
  validateBody,
  registerSchema,
  loginSchema,
  createShareSchema,
};
