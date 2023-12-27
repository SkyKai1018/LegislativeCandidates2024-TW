const fs = require("fs");
const ConstituencyInfo = require("./ConstiuencyInfo.json");
const ConstituencyData = require("./ConstituencyData.json");
const Candidates = require ("./candidate.json")
const turf = require("@turf/turf");

let arr_Constituency_GeoJson = [];
let mergedGeoJson = [];

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

function isEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}

ConstituencyInfo.forEach((elem_Constituency) => {
  let County = elem_Constituency["區域"];

  elem_Constituency["選區資訊"].forEach((elem_CountyConstituency) => {
    let arr_towns_json = [];
    let arr_villages_json = [];
    let candidates={};

    if(elem_Constituency["選區資訊"].length>1){
      const constituencyNo = elem_CountyConstituency['選區名']
      candidates = Candidates.find(item => item.location === County).L1[constituencyNo-1]
    }
    else{
      candidates = Candidates.find(item => item.location === County).L1[0];
    }

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
      arr_towns_json.forEach((elem_town_json) => {

        let geojson =mergeGeoJSON(elem_town_json)
        Object.assign(geojson.properties, {
          county: County,
          constituency: elem_CountyConstituency.選區名,
          candidates:candidates,
        })
        mergedGeoJson.push(geojson);
      });
      
    } catch (error) {
      console.log(error, County, arr_towns_json);
    }
    arr_Constituency_GeoJson.push(mergedGeoJson);
  });
});

const jsonStr = JSON.stringify(mergedGeoJson, null, 2);

fs.writeFile("ConstituencyInfo_GeoJson.json", jsonStr, "utf-8", (err) => {
  if (err) {
    console.error("An error occurred:", err);
    return;
  }
  console.log("Data has been written to JSON file");
});
