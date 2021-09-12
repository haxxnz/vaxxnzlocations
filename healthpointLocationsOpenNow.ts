import fetch from "node-fetch";
import cheerio, { CheerioAPI } from "cheerio";
import fs from 'fs';
import { Branch, HealthpointData, HealthpointLocation, HealthpointPage } from "./types";
import { uniqBy } from "./arrayUtilsTs";
var md5 = require('md5');

const HEALTHPOINT_URL = 'https://www.healthpoint.co.nz';
const ACTUAL_HEALTHPOINT_URL = 'https://www.healthpoint.co.nz';

interface LatLong {
  lat: number;
  lng: number;
}
const missingLatLongs: Record<string,LatLong> = {
  'Unichem Walls and Roche Pharmacy': {
    lat: -36.9116026,
    lng: 174.7761956
  },
  'Mountain Lakes Medical': {
    lat: -45.012970,
    lng: 168.742910
  },
  'Te Rūnanga o Ngāti Porou': {
    lat: -38.674660,
    lng: 178.050940
  }, 
  'Te Tini o Porou': {
    lat: -38.674660,
    lng: 178.050940
  }, 
}

function fullUrl(url: string) {
  return `${ACTUAL_HEALTHPOINT_URL}${url}`
}

function fetchSite(hpUrl: string) {
  const file = `./healthpoint/${md5(hpUrl)}.txt`
  // if (fs.existsSync(file)) { // only for dev
  //   return fs.readFileSync(file).toString()
  // }
  return fetch(`${HEALTHPOINT_URL}${hpUrl}`)
    .then(res => res.text())
    .then(body => {
      fs.writeFileSync(file, body)
      return body
    })
}

function getItemprop($: CheerioAPI, propname: string): string | undefined {
  const propEls = $(`[itemprop="${propname}"]`);
  const prop = propEls.length > 0 ? $(propEls[0]).attr("content") : undefined;
  return prop;
}
function getItempropText($: CheerioAPI, propname: string): string | undefined {
  const propEls = $(`[itemprop="${propname}"]`);
  const prop = propEls.length > 0 ? $(propEls[0]).text() : "";
  return prop;
}


let isFirst = true
function saveHealthpointLocationJson(data: HealthpointLocation) {
  const str = JSON.stringify(data)
  if (isFirst) {
    isFirst = false
    fs.writeFileSync('healthpointLocations.json', "[" + str + "\n")
  }
  else {
    fs.appendFileSync("healthpointLocations.json", "," + str + "\n");
  }
}

function endHealthpointLocationJson() {
  fs.appendFileSync("healthpointLocations.json", "]\n");
}

function nameAddressNormal($: CheerioAPI) {
  const address = $('[itemtype="http://schema.org/Place"]').first().find('h3').text();
  const name = $('#heading h1').text() // TODO: this is the name of the page, not the location
  return {address, name}

}
function nameAddressCommunity($: CheerioAPI) {
  const nameFull = $('[itemtype="http://schema.org/Place"]').first().find('h3 a').html() ?? ''
  let name: string = ''
  if (nameFull) {
    const nameMatch = nameFull.match(/^(.*?),/)
    if (nameMatch) {
      name = nameMatch[1] 
    }
    else {
      name = nameFull
    }
  }
  else {
    name = $('[itemprop="name"]').text()
  }

  const addressEl = $('[itemprop="address"]').first().find('p')
  let address: string = ''
  if (addressEl.html()) {
    const addressStr = (addressEl.html() ?? '').replace(/<br>/g, ', ');
    address = addressStr.trim()      
  }
  else {
    address = nameFull
  }

  return {address, name}

}

async function getHealthpointLocation(body: string, url: string, branch: Branch) {
  const $ = cheerio.load(body);
  const {name, address} = branch === "community" ? nameAddressCommunity($) : nameAddressNormal($)
  console.log('--> url',url)
  console.log({branch,name,address})

  const latStr = getItemprop($, "latitude");
  const lat = latStr ? parseFloat(latStr) : missingLatLongs[name]?.lat ?? undefined;
  const lngStr = getItemprop($, "longitude");
  const lng = lngStr ? parseFloat(lngStr) : missingLatLongs[name]?.lng ?? undefined;
  
  const openningText = $('#section-openingStatusToday .opening-hours').last().text()
  const isOpenToday = openningText.includes('Open today') ? true : openningText.includes('Closed today') ? false : undefined
  const openTodayHours = openningText.replace(/Open today/g, '').replace(/Closed today/g, '').trim()


  const instructionUl = $("#section-covidVaccination .content ul:first");
  const instructionLisEls = $(instructionUl).find("li");
  const instructionLis = instructionLisEls.map((i, li) => $(li).text()).get();


  const telephone = getItempropText($, "telephone");
  const faxNumber = getItempropText($, "faxNumber");


  const table = $("table.hours");
  const schedule: Record<string, string> = {};
  $(table)
    .find("tr")
    .each((i, tr) => {
      const day = $(tr).find("th").text();
      const hours = $(tr).find("td").text();

      schedule[day]  = hours;
    });

    const holidayHoursEls = $('#section-hours2 .hours-holidays')
    const holidayHoursTexts = holidayHoursEls.map((i, el) => $(el).text()).get();
    let exceptions: Record<string, string> = {}
    holidayHoursTexts.map(holidayHoursText => {
      const [key, value] = holidayHoursText.split(':')
      exceptions[key] = value
    })

    const noteEls = $('#section-hours2 p')
    const notesHtml: string[] = []
    noteEls.each((i, el) => {
      const className = $(el).attr('class')
      if (typeof className === 'undefined') {
        const noteHtml = ($(el).html() ?? "").trim()
        if (noteHtml.length) {
          notesHtml.push(noteHtml)
        }
      }
    })


    const sectionHours = $('#section-hours2 .content').html()??""
    const isOther = sectionHours.includes("Other")
    if (isOther) {
      return
    }





  const opennningHours = {
    schedule,
    exceptions,
    notesHtml
  }
  if (!(lat && lng)) {
    return // skip saving this location
  }

  const result = {
    lat,
    lng,
    name,
    branch,
    isOpenToday,
    openTodayHours,
    instructionLis,
    address,
    telephone,
    faxNumber,
    url,
    opennningHours,
  }

  saveHealthpointLocationJson(result);
}

async function fetchHealthpointPage(healthpointPage: HealthpointPage) {
  const url = healthpointPage.url
  const body = await fetchSite(url);
  const $ = cheerio.load(body);
  const latitude = getItemprop($, "latitude");
  const longitude = getItemprop($, "longitude");
  if (latitude && longitude) {
    await getHealthpointLocation(body, fullUrl(url), healthpointPage.branch);
  } else {
    const serviceLocationsEl = $(".service-location h3 a");
    const serviceLocationLinks = serviceLocationsEl
      .map((i, el) => $(el).attr("href"))
      .get();
    for (const serviceLocationLink of serviceLocationLinks) {
      const url = serviceLocationLink
      console.log('going into', serviceLocationLink)
      const body = await fetchSite(serviceLocationLink);
      await getHealthpointLocation(body, fullUrl(url), healthpointPage.branch);
    }
  }

}
async function main() {
  const body = await fetchSite(
    '/geo.do?zoom=22&minLat=-50.054063301361936&maxLat=-30.13148344991528&minLng=97.2021141875&maxLng=-110.4834326875&lat=&lng=&region=&addr=&branch=covid-19-vaccination&options=anyone'
  );
  const data = JSON.parse(body) as HealthpointData;

  const results = data.results;
  const healthpointLocations = uniqBy(results, a => a.id.toString())

  for (const healthpointLocation of healthpointLocations) {
    await fetchHealthpointPage(
      healthpointLocation
    );
  }
  endHealthpointLocationJson()
}

main();
