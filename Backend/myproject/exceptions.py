"""
Custom DRF exception handler.

All API errors are returned as:
  {
    "error": {
      "code":    "validation_error",
      "message": "Request validation failed.",
      "details": [{"field": "email", "message": "..."}]   # optional
    }
  }
"""
from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context) -> Response | None:
    """
    Wrap DRF's default exception handler output in a consistent envelope.
    Returns None for non-DRF exceptions (lets Django's 500 handler take over).
    """
    response = exception_handler(exc, context)

    if response is None:
        return None

    # Map HTTP status to a short error code
    code_map = {
        400: 'bad_request',
        401: 'unauthorized',
        403: 'forbidden',
        404: 'not_found',
        405: 'method_not_allowed',
        409: 'conflict',
        422: 'unprocessable_entity',
        429: 'rate_limit_exceeded',
        500: 'internal_error',
        502: 'bad_gateway',
        503: 'service_unavailable',
    }

    http_code = response.status_code
    error_code = code_map.get(http_code, 'error')

    # DRF validation errors arrive as a dict of field → [messages]
    raw = response.data
    details = None
    message = 'An error occurred.'

    if isinstance(raw, dict):
        # Check if it's a field-level validation error
        non_field = raw.pop('non_field_errors', None)
        if non_field:
            message = ' '.join(str(e) for e in non_field)

        field_errors = []
        for field, errors in raw.items():
            if field in ('detail', 'message', 'error'):
                message = str(errors[0]) if isinstance(errors, list) else str(errors)
            else:
                msgs = errors if isinstance(errors, list) else [errors]
                for msg in msgs:
                    field_errors.append({'field': field, 'message': str(msg)})

        if field_errors:
            error_code = 'validation_error'
            message = 'Request validation failed.'
            details = field_errors

        # Handle DRF's default {"detail": "..."} format
        if 'detail' in raw:
            message = str(raw['detail'])

    elif isinstance(raw, list):
        # Top-level list of errors
        details = [{'message': str(e)} for e in raw]
        message = 'Request validation failed.'
        error_code = 'validation_error'
    else:
        message = str(raw)

    # Add Retry-After header for rate limit responses
    if http_code == status.HTTP_429_TOO_MANY_REQUESTS:
        response['Retry-After'] = '60'

    payload: dict = {'error': {'code': error_code, 'message': message}}
    if details:
        payload['error']['details'] = details

    response.data = payload
    return response
