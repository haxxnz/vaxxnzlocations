const fetch = require("node-fetch");
const uniqLocations = require("./uniqLocations.json");
const fs = require("fs");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getSlots(location, availability) {
  console.log(`Getting slot for ${location.name} - ${availability.date}`);

  const res = await fetch(
    `https://skl-api.bookmyvaccine.covid19.health.nz/public/locations/${location.extId}/date/${availability.date}/slots`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vaccineData: "WyJhMVQ0YTAwMDAwMEhJS0NFQTQiXQ==",
        groupSize: 1,
        url: "https://app.bookmyvaccine.covid19.health.nz/appointment-select",
        timeZone: "Pacific/Auckland",
      }),
    }
  );
  const data = await res.json();
  return data;
}

async function getAvailability(location) {
  // if (fs.existsSync(`./availability/${location.extId}.json`)) {
  //   return;
  // }

  const locationAvailability = require(`./availability/${location.extId}.json`)

  const startDateStr = new Date().toISOString().slice(0, 10);
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 2);
  const endDateStr = endDate.toISOString().slice(0, 10);

  console.log(
    `Getting availability for ${location.name} between ${startDateStr} and ${endDateStr}`
  );

  const res = await fetch(
    `https://skl-api.bookmyvaccine.covid19.health.nz/public/locations/${location.extId}/availability`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: startDateStr,
        endDate: endDateStr,
        vaccineData: "WyJhMVQ0YTAwMDAwMEhJS0NFQTQiXQ==",
        groupSize: 1,
        doseNumber: 1,
        url: "https://app.bookmyvaccine.covid19.health.nz/appointment-select",
        timeZone: "Pacific/Auckland",
      }),
    }
  );
  console.log(res.status);

  const data = await res.json();
  // await sleep(1000);

  const slots = [];
  for (const availability of data.availability) {
    if (!locationAvailability[availability.date]) { // if we know this day has been previously booked out, skip
      // okay, this is not good actually. a slot might get unbooked.
      console.log('skipping previously booked out day')
      continue
    }
    if (!availability.available) {
      continue;
    }
    const slot = await getSlots(location, availability);
    // await sleep(100);
    slots.push(slot);
  }

  const output = {};
  for (const slot of slots) {
    output[slot.date] = slot.slotsWithAvailability;
  }

  fs.writeFileSync(
    `./availability/${location.extId}.json`,
    JSON.stringify(output, null, 2)
  );
}

async function main() {
  console.log('started at', new Date())
  for (const location of uniqLocations) {
    await getAvailability(location);
  }
  console.log('ended at', new Date())
}

main();
