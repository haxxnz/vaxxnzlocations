const fetch = require("node-fetch");
async function getLocations() {
  const res = await fetch(
    "https://skl-api.bookmyvaccine.covid19.health.nz/public/locations/search",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // location: { lat: -36.8560865, lng: 174.8232806 },
        location: { lat: -36.8534194, lng: 174.7595025 },
        
        // lng: 
        fromDate: "2021-08-31",
        vaccineData: "WyJhMVQ0YTAwMDAwMEhJS0NFQTQiXQ==",
        locationQuery: {
          includePools: ["default"],
          includeTags: [],
        //   excludeTags: ["a0p4a000000CInuAAG"],
          excludeTags: [],
        },
        doseNumber: 1,
        groupSize: 1,
        limit: 20,
        cursor: "",
        locationType: "CombinedBooking",
        filterTags: [],
        url: "https://app.bookmyvaccine.covid19.health.nz/location-select",
        timeZone: "Pacific/Auckland",
      }),
    }
  );
  const data = await res.json();
  console.log("data", data.locations.length);
}

getLocations();
