const fs = require("fs");
const ConstituencyInfo = require("./ConstiuencyInfo.json");
const ConstituencyData = require("./ConstituencyData.json");
const turf = require("@turf/turf");

function findFeatureByTownAndVillage(data, town, village, County) {
  return data.features.find(
    (feature) =>
      feature.properties.TOWN === town &&
      feature.properties.VILLAGE === village &&
      feature.properties.COUNTY === County
  );
}

function findAllFeatureByTown(data, town, county) {
  return data.features.filter(
    (feature) =>
      feature.properties.TOWN === town && feature.properties.COUNTY === county
  );
}

function mergeGeoJSON(arr_geojson) {
  try {
    let mergeGeoJson = arr_geojson[0];
    for (let i = 1; i < arr_geojson.length; i++) {
      try {
        mergeGeoJson = turf.union(
          arr_geojson[i].geometry,
          mergeGeoJson.geometry
        );
      } catch (error) {
        console.log(error);
      }
    }
    return mergeGeoJson;
  } catch (error) {
    console.log(error);
  }
}

let arr_Constituency_GeoJson = [];

ConstituencyInfo.forEach((elem_Constituency) => {
  let County = elem_Constituency["區域"];
  elem_Constituency["選區資訊"].forEach((elem_CountyConstituency) => {
    let arr_towns_json = [];
    let arr_villages_json = [];

    elem_CountyConstituency["行政區"].forEach((elem_town) => {
      if (elem_town["里"].length === 0) {
        findAllFeatureByTown(
          ConstituencyData,
          elem_town["區名"],
          County
        ).forEach((element) => {
          arr_villages_json.push(element);
        });
      } else {
        try {
          elem_town["里"].forEach((elem_Village) => {
            arr_villages_json.push(
              findFeatureByTownAndVillage(
                ConstituencyData,
                elem_town["區名"],
                elem_Village,
                County
              )
            );
          });
        } catch (error) {
          console.log(elem_Village);
        }
      }
    });
    arr_towns_json.push(arr_villages_json);
    elem_CountyConstituency.geojson = [];
    elem_CountyConstituency["縣市"] = "";
    try {
      let mergedGeoJson = [];
      arr_towns_json.forEach((elem_town_json) => {
        mergedGeoJson.push(mergeGeoJSON(elem_town_json));
      });
      elem_CountyConstituency.geojson = mergedGeoJson;
      elem_CountyConstituency.縣市 = County;
    } catch (error) {
      console.log(error, County, elem_town_json, arr_towns_json);
    }
    arr_Constituency_GeoJson.push(elem_CountyConstituency);
    console.log(elem_CountyConstituency);
  });
});

const jsonStr = JSON.stringify(arr_Constituency_GeoJson, null, 2);

fs.writeFile("ConstituencyInfo_GeoJson.json", jsonStr, "utf-8", (err) => {
  if (err) {
    console.error("An error occurred:", err);
    return;
  }
  console.log("Data has been written to JSON file");
});
