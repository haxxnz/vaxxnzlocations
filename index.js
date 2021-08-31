const fetch = require("node-fetch");
const turf = require("@turf/turf");
const NZbbox = [166.509144322, -46.641235447, 178.517093541, -34.4506617165];

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
  if (newCursor) {
    const rest = await getLocations(lat, lng, newCursor);
    return [...data.locations, ...rest];
  }
  else {
    return data.locations
  }
}

async function main () {

  const locations = await getLocations(-36.8534194, 174.7595025);
  console.log(locations)
  

}

var extent = NZbbox
var cellSide = 3;
var options = {units: 'kilometers'};

var grid = turf.pointGrid(extent, cellSide, options);
for(var i = 0; i < grid.features.length; i++) {
    const coords = grid.features[i].geometry.coordinates
}


main()