import fetch from "node-fetch";
import cheerio, { CheerioAPI } from "cheerio";


interface HealthpointLocation {
  lat: number;
  lng: number;
  name: string;
  id: number;
  url: string;
  branch: "primary" | "pharmacy" | "community";
}
interface Data {
  results: HealthpointLocation[];
}



function getItemprop($: CheerioAPI, propname: string): string | undefined {
  const propEls = $(`[itemprop="${propname}"]`);
  const prop = propEls.length > 0 ? $(propEls[0]).attr("content") : undefined;
  return prop;
}

async function fetchHealthpointLocation(
  healthpointLocation: HealthpointLocation
) {
  const fullUrl = `https://www.healthpoint.co.nz${healthpointLocation.url}`;
  const res = await fetch(fullUrl);
  const body = await res.text();
  const $ = cheerio.load(body);
  const latitude = getItemprop($, "latitude");
  const longitude = getItemprop($, "longitude");
  console.log(latitude, longitude)
}
async function main() {
  const res = await fetch(
    "https://www.healthpoint.co.nz/geo.do?zoom=22&minLat=-50.054063301361936&maxLat=-30.13148344991528&minLng=97.2021141875&maxLng=-110.4834326875&lat=&lng=&region=&addr=&branch=covid-19-vaccination&options=anyone"
  );
  const data = (await res.json()) as Data;

  const results = data.results;

  for (const healthpointLocation of results) {
    // branches.push(healthpointLocation.branch);
    const healthpointLocationWithHours = await fetchHealthpointLocation(healthpointLocation)
    // console.log(JSON.stringify(healthpointLocationWithHours))
    // console.log(healthpointLocationWithHours)
  }
}

main();
