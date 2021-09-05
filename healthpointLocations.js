const fetch = require("node-fetch");
const cheerio = require('cheerio');

async function fetchHealthpointLocation(healthpointLocation) {
  const res = await fetch(`https://www.healthpoint.co.nz/${healthpointLocation.url}`)
  const body = await res.text()
  // console.log('body',body)
  const $ = cheerio.load(body);
  const table = $('table.hours')
  const opennningHours = new Map()
  $(table).find('tr').each((i, tr) => {
    // console.log('tr',tr)
    const day = $(tr).find('th').text()
    const hours = $(tr).find('td').text()
    console.log('day',day)
    console.log('hours',hours)
    
    opennningHours[day] = hours
  })
  console.log('opennningHours',opennningHours)
  // console.log("$(hoursTable).find('tr')",$(hoursTable).find('tr'))


  return body
}

async function main() {
  const res = await fetch(
    "https://www.healthpoint.co.nz/geo.do?zoom=22&minLat=-50.054063301361936&maxLat=-30.13148344991528&minLng=97.2021141875&maxLng=-110.4834326875&lat=&lng=&region=&addr=&branch=covid-19-vaccination&options=anyone", {})
  const data = await res.json()
  const {results} = data

  const firstHealthpointLocation = results[2]
  fetchHealthpointLocation(firstHealthpointLocation)

}

main()