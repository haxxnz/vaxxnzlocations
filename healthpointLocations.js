const fetch = require("node-fetch");
const cheerio = require('cheerio');

function getItemprop($, propname) {
  const propEls = $(`[itemprop="${propname}"]`)
  const prop = propEls.length > 0 ? $(propEls[0]).text() : ''
  return prop
}

async function fetchHealthpointLocation(healthpointLocation) {
  const url = `https://www.healthpoint.co.nz${healthpointLocation.url}`
  const res = await fetch(url)
  const body = await res.text()
  console.log('body',body)
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

  // const address = $('[itemprop="address"]').text()
  const name = $('#heading h1').text()
  const address = $('[itemtype="http://schema.org/Place"] h3').text()
  
  const telephone = getItemprop($, 'telephone')
  const faxNumber = getItemprop($, 'faxNumber')
  // const telephoneElements = $('[itemprop="telephone"]')
  // const phone = telephoneElements.length > 0 ? $(telephoneElements[0]).text() : ''

  // faxNumber

  const instruction = $('#section-covidVaccination .content').html()
  const bookButton = $('#section-covidVaccinationBookingUrl')

  const instructionListItemsEls = $('#section-covidVaccination .content ul li')
  const instructionListItems = instructionListItemsEls.map((i, li) => $(li).text()).get()
  // const 



  

  console.log('url',url)
  console.log('name',name)
  console.log('opennningHours',opennningHours)
  console.log('address',address)
  console.log('telephone',telephone)
  console.log('faxNumber',faxNumber)
  console.log('instruction',instruction)
  console.log('bookButton.length',bookButton.length)
  console.log('instructionListItems',instructionListItems)
  // console.log("$(hoursTable).find('tr')",$(hoursTable).find('tr'))


  return opennningHours
}

async function main() {
  const res = await fetch(
    "https://www.healthpoint.co.nz/geo.do?zoom=22&minLat=-50.054063301361936&maxLat=-30.13148344991528&minLng=97.2021141875&maxLng=-110.4834326875&lat=&lng=&region=&addr=&branch=covid-19-vaccination&options=anyone", {})
  const data = await res.json()
  const {results} = data

  const firstHealthpointLocation = results[2]
  const info = await fetchHealthpointLocation(firstHealthpointLocation)

}

main()