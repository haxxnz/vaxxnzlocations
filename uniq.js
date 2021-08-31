const locations = require("./locations.json");
const fs = require('fs')

function uniqBy(array, comparator) {
  return array.filter(function (value, index, self) {
    return (
      self.findIndex(function (item) {
        return comparator(item) === comparator(value);
      }) === index
    );
  });
}

let isFirst = true
function saveLocationsJson(data) {
  const str = JSON.stringify(data)
  console.log(data.extId, data.displayAddress)
  if (isFirst) {
    isFirst = false
    fs.writeFileSync('uniqLocations.json', "[" + str + "\n")
  }
  else {
    fs.appendFileSync("uniqLocations.json", "," + str + "\n");
  }
}

function endLocationsJson(data) {
  fs.appendFileSync("uniqLocations.json", "]\n");
}
  

const uniqLocations = uniqBy(locations, l => l.extId)

for (let i = 0; i < uniqLocations.length; i++) {
    const location = uniqLocations[i];
    saveLocationsJson(location)
}
endLocationsJson()

