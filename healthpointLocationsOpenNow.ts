import fetch from "node-fetch";
import cheerio, { CheerioAPI } from "cheerio";
import fs from 'fs';
import { Branch, HealthpointData, HealthpointLocation, HealthpointPage } from "./types";



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
  console.log(data.name)
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

function nameAddressNormal($) {
  const address = $('[itemtype="http://schema.org/Place"]:first h3').text();
  const name = $('#heading h1').text() // TODO: this is the name of the page, not the location
  return {address, name}

}
function nameAddressCommunity($) {
  const address = ($('[itemprop="address"]:first p').html() ?? '').replace(/<br>/g, ', ');
  const nameMatch = ($('[itemtype="http://schema.org/Place"]:first h3 a').html() ?? '').match(/^(.*?),/)
  let name = ''
  if (nameMatch) {
    name = nameMatch[1] 
  }
  return {address, name}

}

async function getHealthpointLocation(body: string, url: string, branch: Branch) {
  const $ = cheerio.load(body);
  const {name, address} = branch === "community" ? nameAddressCommunity($) : nameAddressNormal($)
  console.log('url',url)
  console.log('branch',branch)
  console.log('name',name)
  console.log('address',address)

  const latStr = getItemprop($, "latitude");
  const lat = latStr ? parseFloat(latStr) : undefined
  const lngStr = getItemprop($, "longitude");
  const lng = lngStr ? parseFloat(lngStr) : undefined
  const openningText = $('#section-openingStatusToday .opening-hours').text()
  const isOpenToday = openningText.includes('Open today') ? true : openningText.includes('Closed today') ? false : undefined


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
    // console.log('exceptions',exceptions)

    const noteEls = $('#section-hours2 p')
    const notes: string[] = []
    noteEls.each((i, el) => {
      const className = $(el).attr('class')
      // console.log('className',className)
      if (typeof className === 'undefined') {
        const note = $(el).text().trim()
        if (note.length) {
          notes.push(note)
        }
      }
    })
    // console.log('notes',notes)


    const sectionHours = $('#section-hours2 .content').html()??""
    const isOther = sectionHours.includes("Other")
    // console.log('url',url)
    // console.log('isOther',isOther)
    if (isOther) {
      // process.exit(0)
      return
    }





  const opennningHours = {
    schedule,
    exceptions,
    notes
  }

  const result = {
    lat,
    lng,
    name,
    branch,
    isOpenToday,
    instructionLis,
    address,
    telephone,
    faxNumber,
    opennningHours,
  }

  saveHealthpointLocationJson(result);


}

async function fetchHealthpointPage(healthpointPage: HealthpointPage) {
  const fullUrl = `https://www.healthpoint.co.nz${healthpointPage.url}`;
  const res = await fetch(fullUrl);
  const body = await res.text();
  const $ = cheerio.load(body);
  const latitude = getItemprop($, "latitude");
  const longitude = getItemprop($, "longitude");
  // console.log('fullUrl',fullUrl)
  if (latitude && longitude) {
    await getHealthpointLocation(body, fullUrl, healthpointPage.branch);
  } else {
    const serviceLocationsEl = $(".service-location h3 a");
    const serviceLocationLinks = serviceLocationsEl
      .map((i, el) => $(el).attr("href"))
      .get();
    for (const serviceLocationLink of serviceLocationLinks) {
      console.log('going into', serviceLocationLink)
      const fullUrl = `https://www.healthpoint.co.nz${serviceLocationLink}`
      const res = await fetch(
        fullUrl
      );
      const body = await res.text();
      await getHealthpointLocation(body, fullUrl, healthpointPage.branch);
    }
  }

}
async function main() {
  const res = await fetch(
    "https://www.healthpoint.co.nz/geo.do?zoom=22&minLat=-50.054063301361936&maxLat=-30.13148344991528&minLng=97.2021141875&maxLng=-110.4834326875&lat=&lng=&region=&addr=&branch=covid-19-vaccination&options=anyone"
  );
  const data = (await res.json()) as HealthpointData;

  const results = data.results;

  for (const healthpointLocation of results) {
    await fetchHealthpointPage(
      healthpointLocation
    );
  }
  endHealthpointLocationJson()
}

main();
