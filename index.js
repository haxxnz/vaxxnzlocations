const fetch = require("node-fetch");
const turf = require("@turf/turf");
const fs = require('fs')
const {format} = require('date-fns');
const { differenceBy, sortBy } = require("lodash");
const {catastropicResponseFailure, catastropicFailure} = require('./lib/error')
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
  if (res.status !== 200) {
    await catastropicResponseFailure(res);
  }
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

const getAllPointsToCheck = async () => {
  const res = await fetch("https://maps.bookmyvaccine.covid19.health.nz/booking_site_availability.json")
  if (res.status !== 200) {
    await catastropicResponseFailure(res);
  }
  const data = await res.json()
  return data
}

async function main () {
  try {

    const pointsToCheck = await getAllPointsToCheck()
    if (pointsToCheck.features.length === 0) {
      throw new Error(`No points to check as of`)
    }
    console.log('pointsToCheck count', pointsToCheck.features.length)

    var maxDistance = 10; // keep this as 10km clustering
    console.log('maxDistance',maxDistance)
    var clustered = turf.clustersDbscan(pointsToCheck, maxDistance, {units: "kilometers"});

    const clusterFeatures = []
    turf.clusterReduce(clustered, 'cluster', function (previousValue, cluster, clusterValue, currentIndex) {
      clusterFeatures.push(cluster.features[0])
      console.log('clusterPoint',cluster.features[0].geometry.coordinates)
      return previousValue++;
    }, 0);

    const otherFeatures = clustered.features.filter(f => f.properties.dbscan === "noise")
    console.log('otherPoints count', otherFeatures.length)


    save('startedLocationsScrapeAt.json', `"${new Date().toISOString()}"`)
    const featuresToCheck = [...clusterFeatures, ...otherFeatures]
    for(var i = 0; i < featuresToCheck.length; i++) {
        const coords = featuresToCheck[i].geometry.coordinates

        await getLocations(coords[1], coords[0]);
        console.log(`${i}/${featuresToCheck.length}`)
    }
    const sortedLocations = sortBy(uniqLocations, 'extId')

    if (sortedLocations.length === 0) {
      throw new Error(`No locations to save as of`)
    }

    save('uniqLocations.json', JSON.stringify(sortedLocations, null, 2))
    console.log('sortedLocations.length',sortedLocations.length)

    const differenceLocations = differenceBy(uniqLocations, pointsToCheck.features.map(f => ({ extId: f.properties.locationID })), 'extId')
    console.log('differenceLocations',differenceLocations)
    console.log('differenceLocations.length',differenceLocations.length)
    save('endedLocationsScrapeAt.json', `"${new Date().toISOString()}"`)
  }
  catch (error) {
    await catastropicFailure(new Error(`${error.message} as of ${new Date().toISOString()}`))
  }
}
main()