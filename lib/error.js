

module.exports.catastropicResponseFailure = function catastropicResponseFailure(res) {
  Sentry.captureException(new Error("Scraper failed"), (scope) => {
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

module.exports.catastropicFailure = function catastropicFailure(errorMessage) {
  Sentry.captureException(new Error(errorMessage));
  process.exit(1)
}
