const fetch = require("node-fetch");
async function getLocations(lat, lng, cursor) {
  const res = await fetch(
    "https://skl-api.bookmyvaccine.covid19.health.nz/public/locations/search",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location: { lat, lng },
        fromDate: "2021-08-31",
        vaccineData: "WyJhMVQ0YTAwMDAwMEhJS0NFQTQiXQ==",
        locationQuery: {
          includePools: ["default"],
          includeTags: [],
          excludeTags: [],
        },
        doseNumber: 1,
        groupSize: 1,
        limit: 10000,
        cursor: cursor,
        locationType: "CombinedBooking",
        filterTags: [],
        url: "https://app.bookmyvaccine.covid19.health.nz/location-select",
        timeZone: "Pacific/Auckland",
      }),
    }
  );
  const data = await res.json();
  const newCursor = data.cursor;
  console.log(newCursor);
  console.log("data", data.locations.length);
  if (newCursor) {
    return getLocations(lat, lng,newCursor);
  }
}

getLocations(-36.8534194, 174.7595025);
