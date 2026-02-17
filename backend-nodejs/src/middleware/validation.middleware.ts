import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationError } from "express-validator";

/**
 * Generic validation middleware that checks express-validator results
 * and returns standardized error response if validation fails
 */
export function validate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error: ValidationError) => ({
      field: error.type === "field" ? (error as any).path : undefined,
      message: error.msg,
    }));

    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
    });
    return;
  }

  next();
}
