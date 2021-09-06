const fetch = require("node-fetch");
const turf = require("@turf/turf");
const nz = require('./nz.json')
const fs = require('fs')
const NZbbox = [166.509144322, -46.641235447, 178.517093541, -34.4506617165];

let isFirst = true
function saveLocationsJson(data) {
  const str = JSON.stringify(data)
  console.log(data.extId, data.displayAddress)
  if (isFirst) {
    isFirst = false
    fs.writeFileSync('uniqLocationsNew.json', "[" + str + "\n")
  }
  else {
    fs.appendFileSync("uniqLocationsNew.json", "," + str + "\n");
  }
}

function endLocationsJson(data) {
  fs.appendFileSync("uniqLocationsNew.json", "]\n");
}

const locationIds = new Set([])

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
        fromDate: "2021-09-05",
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
    for (let i = 0; i < data.locations.length; i++) {
      const location = data.locations[i];
      if (!locationIds.has(location.extId)) {
        locationIds.add(location.extId)
        saveLocationsJson(location);      
      }
    }
    return [...data.locations, ...rest];
  }
  else {
    return data.locations
  }
}

async function main () {
  var extent = NZbbox
  var cellSide = 30;
  var options = {units: 'kilometers', mask: nz};

  var grid = turf.pointGrid(extent, cellSide, options);
  for(var i = 0; i < grid.features.length; i++) {
      const coords = grid.features[i].geometry.coordinates
      await getLocations(coords[1], coords[0]);
      console.log(`${i}/${grid.features.length}`)
  }
  endLocationsJson()
}
main()