const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://f557fb3089024cb2a6eb50e51934348c@o265348.ingest.sentry.io/5962322",
  tracesSampleRate: 1.0,
});


module.exports.catastropicStatusFailure = async function (res, body) {
  const error = new Error(`Response status ${res.status}`)
  console.error(`CATASTROPIC FAILURE: ${error.message}`)
  Sentry.captureException(error, (scope) => {
    scope.setFingerprint([error.message, String(Date.now())]);
    scope.addBreadcrumb({
      data: res.status,
      message: 'res.status'
    });
    scope.addBreadcrumb({
      data: res.statusText,
      message: 'res.statusText'
    });
    scope.addBreadcrumb({
      data: body,
      message: 'body'
    });
  });
  await Sentry.close(2000)
  process.exit(1);
}

module.exports.catastropicParseFailure = async function (error, res, body) {
  console.error(`CATASTROPIC FAILURE: ${error.message}`)
  Sentry.captureException(error, (scope) => {
    scope.setFingerprint([error.message, String(Date.now())]);
    scope.addBreadcrumb({
      data: res.status,
      message: 'res.status'
    });
    scope.addBreadcrumb({
      data: res.statusText,
      message: 'res.statusText'
    });
    scope.addBreadcrumb({
      data: body,
      message: 'body'
    });
  });
  await Sentry.close(2000)
  process.exit(1);
}

module.exports.catastropicFailure = async function (error) {
  console.error(`CATASTROPIC FAILURE: ${error.message}`)
  Sentry.captureException(error, (scope) => {
    scope.setFingerprint([error.message, String(Date.now())]);
  });
  await Sentry.close(2000)
  process.exit(1)
}
