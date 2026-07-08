/**
 * MatchDay Copilot — Input Validation Middleware
 *
 * Validates and sanitizes all user-submitted fields using express-validator.
 */

import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { sanitizeUserInput } from '../services/genai/safetyCheck';

/**
 * Validation rules for the fan chat endpoint.
 */
export const validateChatRequest = [
  body('message')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Message cannot be empty')
    .isLength({ max: 1000 })
    .withMessage('Message must be under 1000 characters'),

  body('persona')
    .optional()
    .isIn(['fan', 'staff', 'organizer'])
    .withMessage('Invalid persona'),

  body('conversationHistory')
    .optional()
    .isArray({ max: 20 })
    .withMessage('History must be an array with max 20 messages'),

  body('userContext').optional().isObject().withMessage('User context must be an object'),

  body('userContext.ticketSection')
    .optional()
    .isString()
    .isLength({ max: 20 })
    .withMessage('Ticket section must be a string under 20 characters'),

  handleValidationErrors,
];

/**
 * Validation rules for staff quick-reply drafting.
 */
export const validateStaffReplyRequest = [
  body('staffNote')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Staff note cannot be empty')
    .isLength({ max: 500 })
    .withMessage('Staff note must be under 500 characters'),

  body('targetLanguage')
    .isIn(['en', 'es', 'fr', 'pt', 'ar'])
    .withMessage('Unsupported target language'),

  body('fanOriginalMessage')
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Fan message must be under 1000 characters'),

  handleValidationErrors,
];

/**
 * Middleware to sanitize the chat message for prompt injection.
 */
export function sanitizeChatMessage(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.body?.message) {
    const { sanitized, wasModified } = sanitizeUserInput(req.body.message as string);
    req.body.message = sanitized;
    if (wasModified) {
      req.body._inputWasSanitized = true;
    }
  }
  next();
}

function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
    return;
  }
  next();
}
