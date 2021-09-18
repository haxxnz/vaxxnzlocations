const {catastropicStatusFailure, catastropicParseFailure, catastropicFailure} = require('./error')
const fetch = require("node-fetch");

module.exports.mohFetch = async function mohFetch(url, options) {
  let json
  try {
    const res = await fetch(
      url,
      {
        ...options,
        headers: {
          ...options.headers,
          "User-Agent": "vaxx.nz - crawler",
          "X-Contact-Us": "info@vaxx.nz"
        },
      }
    );
    const body = await res.text();
    if (res.status !== 200) {
      if (res.status >= 500 && res.status < 599) {
          // MOH is down, so we'll try again in a minute.
        process.exit(0)
      } else {
        await catastropicStatusFailure(res, body);
      }
    }
    try {
      json = JSON.parse(body);
    }
    catch (error)  {
      await catastropicParseFailure(error, res, body)
    }
  }
  catch (fetchError) {
    await catastropicFailure(fetchError)
  }
  return json
}
