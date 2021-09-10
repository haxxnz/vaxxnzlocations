const fetch = require("node-fetch");
const turf = require("@turf/turf");
const nz = require('./nz.json')
const fs = require('fs')
const {format} = require('date-fns');
const { differenceBy } = require("lodash");
const NZbbox = [166.509144322, -46.641235447, 178.517093541, -34.4506617165];
require('dotenv').config()

function save(file, str) {
  fs.writeFileSync(file, str + "\n")
}



const locationIds = new Set([])

const uniqLocations = []

async function getLocations(lat, lng, cursor) {
  const res = await fetch(
    `${process.env.PROXY_URL}/public/locations/search`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location: { lat, lng },
        fromDate: format(new Date(), 'yyyy-MM-dd'),
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
        uniqLocations.push(location);      
      }
    }
    return [...data.locations, ...rest];
  }
  else {
    return data.locations
  }
}

const getAllCoordsToCheck = async () => {
  const res = await fetch("https://maps.bookmyvaccine.covid19.health.nz/booking_site_availability.json")
  const data = await res.json()
  return data
}

async function main () {

  const data = await getAllCoordsToCheck()
  console.log('data', data.features.length)

  var maxDistance = 10;
  console.log('maxDistance',maxDistance)
  var clustered = turf.clustersDbscan(data, maxDistance, {units: "kilometers"});

  let initialValue = 0
  const clusterFeatures = []
  turf.clusterReduce(clustered, 'cluster', function (previousValue, cluster, clusterValue, currentIndex) {
    clusterFeatures.push(cluster.features[0])
    console.log('cluster',cluster.features[0].geometry.coordinates)
    return previousValue++;
  }, initialValue);
  console.log('initialValue',initialValue)


  const otherFeatures = clustered.features.filter(f => f.properties.dbscan === "noise")
  console.log('otherPoints', otherFeatures.length)


  save('startedLocationsScrapeAt.json', `"${new Date().toISOString()}"`)
  const featuresToCheck = [...clusterFeatures, ...otherFeatures]
  for(var i = 0; i < featuresToCheck.length; i++) {
      const coords = featuresToCheck[i].geometry.coordinates

      await getLocations(coords[1], coords[0]);
      console.log(`${i}/${featuresToCheck.length}`)
  }
  save('uniqLocations.json', JSON.stringify(uniqLocations, null, 2))
  console.log('uniqLocations.length',uniqLocations.length)

  const differenceLocations = differenceBy(uniqLocations, data.features.map(f => ({ extId: f.properties.locationID })), 'extId')
  console.log('differenceLocations',differenceLocations)
  console.log('differenceLocations.length',differenceLocations.length)
  save('endedLocationsScrapeAt.json', `"${new Date().toISOString()}"`)
}
main()