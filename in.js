const fetch = require("node-fetch");
const uniqLocations = require("./uniqLocations.json");
const fs = require("fs");
require('dotenv').config()

function save(file, str) {
  fs.writeFileSync(file, str + "\n")
}

async function getAvailability(location) {
  const locationAvailability = require(`./availability/${location.extId}.json`)


  fs.writeFileSync(
    `./availability/${location.extId}.json`,
    JSON.stringify({ availabilityDates: locationAvailability, lastUpdatedAt: new Date() }, null, 2)
  );
}

async function main() {
  save('startedScrapeAt.json', `"${new Date().toISOString()}"`)
  console.log('started at', new Date())
  for (const location of uniqLocations) {
    await getAvailability(location);
  }
  console.log('ended at', new Date())
  save('endedScrapeAt.json', `"${new Date().toISOString()}"`)
}

main();
