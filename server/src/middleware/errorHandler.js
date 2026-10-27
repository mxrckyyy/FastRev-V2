// Centralized error handler. Never exposes internals or secrets.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message =
    status >= 500 ? 'Internal server error' : err.message || 'Request failed';
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err?.message);
  }
  res.status(status).json({ error: { code: err.code || 'ERROR', message } });
}

export default errorHandler;