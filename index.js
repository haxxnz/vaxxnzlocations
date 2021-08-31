const fetch = require("node-fetch");
async function getLocations(cursor) {
  const res = await fetch(
    "https://skl-api.bookmyvaccine.covid19.health.nz/public/locations/search",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location: { lat: -36.8534194, lng: 174.7595025 },
        fromDate: "2021-08-31",
        vaccineData: "WyJhMVQ0YTAwMDAwMEhJS0NFQTQiXQ==",
        locationQuery: {
          includePools: ["default"],
          includeTags: [],
          excludeTags: [],
        },
        doseNumber: 1,
        groupSize: 1,
        limit: 20,
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
    return getLocations(newCursor);
  }
}

getLocations();
