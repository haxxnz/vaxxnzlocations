import fetch from "node-fetch";
import cheerio, { CheerioAPI } from "cheerio";

interface HealthpointPage {
  lat: number;
  lng: number;
  name: string;
  id: number;
  url: string;
  branch: "primary" | "pharmacy" | "community";
}
interface Data {
  results: HealthpointPage[];
}

function getItemprop($: CheerioAPI, propname: string): string | undefined {
  const propEls = $(`[itemprop="${propname}"]`);
  const prop = propEls.length > 0 ? $(propEls[0]).attr("content") : undefined;
  return prop;
}

async function getHealthpointLocation(body: string) {
  const $ = cheerio.load(body);
  const address = $('[itemtype="http://schema.org/Place"] h3').text();
  console.log('address',address);

}

async function fetchHealthpointPage(healthpointPage: HealthpointPage) {
  const fullUrl = `https://www.healthpoint.co.nz${healthpointPage.url}`;
  const res = await fetch(fullUrl);
  const body = await res.text();
  const $ = cheerio.load(body);
  const latitude = getItemprop($, "latitude");
  const longitude = getItemprop($, "longitude");
  if (latitude && longitude) {
    await getHealthpointLocation(body);
  } else {
    const serviceLocationsEl = $(".service-location h3 a");
    const serviceLocationLinks = serviceLocationsEl
      .map((i, el) => $(el).attr("href"))
      .get();
    for (const serviceLocationLink of serviceLocationLinks) {
      console.log('going into', serviceLocationLink)
      const res = await fetch(
        `https://www.healthpoint.co.nz${serviceLocationLink}`
      );
      const body = await res.text();
      const serviceLocationPage = await getHealthpointLocation(body);
    }
  }

}
async function main() {
  const res = await fetch(
    "https://www.healthpoint.co.nz/geo.do?zoom=22&minLat=-50.054063301361936&maxLat=-30.13148344991528&minLng=97.2021141875&maxLng=-110.4834326875&lat=&lng=&region=&addr=&branch=covid-19-vaccination&options=anyone"
  );
  const data = (await res.json()) as Data;

  const results = data.results;

  for (const healthpointLocation of results) {
    // branches.push(healthpointLocation.branch);
    const healthpointLocationWithHours = await fetchHealthpointPage(
      healthpointLocation
    );
  }
}

main();
