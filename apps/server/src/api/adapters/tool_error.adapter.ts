import httpErrors from 'http-errors';

export type ToolErrorDetails = {
  hint?: string;
  suggested_next_tool?: string;
};

type ToolHttpError = Error & {
  statusCode: number;
  code?: string;
  details?: ToolErrorDetails;
};

export function mapToolError(error: Record<string, unknown>): ToolHttpError {
  const status = typeof error.status === 'number' ? error.status : 400;
  const message =
    typeof error.message === 'string' && error.message.length > 0
      ? error.message
      : 'Tool execution failed';
  const mapped = (
    status === 401
      ? httpErrors.Unauthorized(message)
      : status === 403
        ? httpErrors.Forbidden(message)
        : status === 404
          ? httpErrors.NotFound(message)
          : status >= 500
            ? httpErrors.InternalServerError(message)
            : httpErrors.BadRequest(message)
  ) as ToolHttpError;

  if (typeof error.code === 'string') mapped.code = error.code;
  const details: ToolErrorDetails = {
    ...(typeof error.hint === 'string' && { hint: error.hint }),
    ...(typeof error.suggested_next_tool === 'string' && {
      suggested_next_tool: error.suggested_next_tool,
    }),
  };
  if (Object.keys(details).length > 0) mapped.details = details;
  return mapped;
}
