const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://f557fb3089024cb2a6eb50e51934348c@o265348.ingest.sentry.io/5962322",
  tracesSampleRate: 1.0,
});


module.exports.catastropicResponseFailure = function catastropicResponseFailure(res) {
  const error = new Error("non-200 response status")
  console.error(`CATASTROPIC FAILURE: ${error.message}`)
  Sentry.captureException(error, (scope) => {
    scope.addBreadcrumb({
      data: res.status,
      message: res.text()
    });
    scope.addBreadcrumb({
      data: res.text(),
      message: 'Response string'
    });
  });
  process.exit(1);
}

module.exports.catastropicFailure = function catastropicFailure(error) {
  console.error(`CATASTROPIC FAILURE: ${error.message}`)
  Sentry.captureException(error);
  process.exit(1)
}
