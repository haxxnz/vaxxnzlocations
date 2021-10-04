require('dotenv').config()
const uniqLocations = require("../uniqLocations.json");
const pLimit = require('p-limit');
const fs = require("fs");
const { sortByAsc } = require('./arrayUtils.js')
const {catastropicFailure} = require('./error')
const {bmvFetch} = require('./fetch')

function save(file, str) {
  fs.writeFileSync(file, str + "\n")
}

async function getSlots(location, availability) {
  console.log(`Getting slot for ${location.name} - ${availability.date}`);

  const data = await bmvFetch(
    `${process.env.PROXY_URL}/public/locations/${location.extId}/date/${availability.date}/slots`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vaccineData: "WyJhMVQ0YTAwMDAwMEhSNWhFQUciXQ==",
        groupSize: 1,
        url: "https://app.bookmyvaccine.covid19.health.nz/appointment-select",
        timeZone: "Pacific/Auckland",
      }),
    }
  );
  return data;
}

async function getAvailability(location) {
  let locationData = { availabilityDates: {}, lastUpdatedAt: new Date(0).toISOString() }
  try {
    locationData = require(`../availability/${location.extId}.json`)
  }
  catch (e) {
    console.log('No availability data for', location.name, location.extId)
  }

  const startDateStr = new Date().toISOString().slice(0, 10);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 60);
  const endDateStr = endDate.toISOString().slice(0, 10);

  console.log(
    `Getting availability for ${location.name} between ${startDateStr} and ${endDateStr}`
  );

  const data = await bmvFetch(
    `${process.env.PROXY_URL}/public/locations/${location.extId}/availability`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: startDateStr,
        endDate: endDateStr,
        vaccineData: "WyJhMVQ0YTAwMDAwMEhSNWhFQUciXQ==",
        groupSize: 1,
        doseNumber: 1,
        url: "https://app.bookmyvaccine.covid19.health.nz/appointment-select",
        timeZone: "Pacific/Auckland",
      }),
    }
  );

  // Making it configurable so that we can easily pump the number up from env if w want to
  const maxPromiseRunningTotal = parseInt(process.env.MAX_PROMISE).toString() === 'NaN' ? 2 : parseInt(process.env.MAX_PROMISE)
  const limit = pLimit(maxPromiseRunningTotal);
  const promiseQueue = [];
  for (const availability of data.availability) {
    if (!availability.available) {
      continue;
    }
    promiseQueue.push(limit(() => getSlots(location, availability)))
  }
  const slots = await Promise.all(promiseQueue);
  const output = {};
  for (const slot of slots) {
    output[slot.date] = slot.slotsWithAvailability;
  }

  fs.writeFileSync(
    `./availability/${location.extId}.json`,
    JSON.stringify({ availabilityDates: output, lastUpdatedAt: new Date() }, null, 2)
  );
}

async function main() {

  try {
    const locationsWithDates = []
    for (const location of uniqLocations) {
      let locationData = {availabilityDates: {}, lastUpdatedAt: new Date(0).toISOString()}
      try {
        locationData = require(`../availability/${location.extId}.json`)
      }
      catch (e) {
        console.log('No availability data for', location.name, location.extId)
      }
      const lastUpdatedAt = locationData.lastUpdatedAt || new Date(0).toISOString()
      locationsWithDates.push({ lastUpdatedAt, location })
    }
    const sortedLocationsWithDates = sortByAsc(locationsWithDates, a => a.lastUpdatedAt)

    save('startedScrapeAt.json', `"${new Date().toISOString()}"`)
    console.log('started at', new Date())
    for (const sortedLocationWithDate of sortedLocationsWithDates) {
      await getAvailability(sortedLocationWithDate.location);
    }
    console.log('ended at', new Date())
    save('endedScrapeAt.json', `"${new Date().toISOString()}"`)
  }
  catch (error) {
    await catastropicFailure(error)
  }
}

main();
