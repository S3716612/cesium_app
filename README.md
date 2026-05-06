# RMIT Cloud GIS: GEE App & Cesium App


## Project Details
**Author:** Luke Pattison  
**Student ID:** S3716612  
**Course:** GEOM2138 - Cloud based open-source GIS

---

# Part 1: Google Earth Engine App
**GEE Web App:** -https://code.earthengine.google.com/b769453c4bdefdee7b5fb51607b089bb
                 -https://s3716612.projects.earthengine.app/view/gee--melbourne-summer-2025-web-app  

---

## Application Features
This application is designed to interactively explore environmental layers across the Greater Melbourne Area for the Summer 2025 period (Dec 2024 - Feb 2025).

## Available Layers
- **Land Surface Temperature (LST)**
  - Source: MODIS Aqua (`MYD11A2.061`)
  - Link: [MODIS Aqua Catalog](https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MYD11A2#description)
  
- **Normalised Difference Vegetation Index (NDVI)**
  - Source: Sentinel-2 Harmonised

- **AlphaEarth Embeddings**
  - Source: Google Satellite Embedding V1
  - Link: [Google Satellite Embedding Catalog](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL)

- **SA2_2021_Mel_WGS84 (Table)**
  - Source: Course provided.
  
---

### How to Use:
1. Choose a Greater Melbourne region (SA4) from the dropdown menu.
2. Select a target layer from the interface.
3. Click the **Run Analysis** button to generate the visual composite.
4. Export the resulting data as either a GeoTIFF or a CSV table.

---

## Raw Code:

```javascript
// 1. IMPORTS & PARAMETERS
var SA2_ASSET = 'projects/s3716612/assets/SA2_2021_Mel_WGS84';
var FIELD_SA4 = 'SA4_NAME21';
var FIELD_SA2 = 'SA2_NAME21';

// Season: Summer 2025 (Australia: Dec 2024 - Feb 2025)
var START_DATE = '2024-12-01';
var END_DATE   = '2025-02-28';

// MODIS LST
var MODIS = 'MODIS/061/MYD11A2';
var BAND_LST = 'LST_Day_1km';
var SCALE_LST = 1000;

// Sentinel-2 NDVI
var S2 = 'COPERNICUS/S2_HARMONIZED';
var SCALE_NDVI = 10;

// AlphaEarth Embeddings
var EMBEDDING = 'GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL';

// Palettes
var LST_PALETTE = [
  '040274','040281','0502a3','0502b8','0502ce','0502e6',
  '0602ff','235cb1','307ef3','269db1','30c8e2','32d3ef',
  '3be285','3ff38f','86e26f','3ae237','b5e22e','d6e21f',
  'fff705','ffd611','ffb613','ff8b13','ff6e08','ff500d',
  'ff0000','de0101','c21301','a71001','911003'
];

var NDVI_PALETTE = ['brown','yellow','green'];


// 2. BASEMAP
var SA2 = ee.FeatureCollection(SA2_ASSET);
Map.centerObject(SA2, 8);


// 3. UI PANEL
var panel = ui.Panel({style:{width:'340px', padding:'10px'}});
ui.root.insert(0, panel);

panel.add(ui.Label('Melbourne Summer 2025 Web App', {
  fontWeight:'bold', fontSize:'18px'
}));

// Step-by-step instructions (Matching your Week 8 guide)
panel.add(ui.Label(
  'Student ID: S3716612 | Name: Luke Pattison\n\n' +
  'Step 1: Choose a region (SA4).\n' +
  'Step 2: Select a layer (Land Surface Temperature, NDVI or AlphaEarth) and click Run Analysis.\n' +
  'Step 3: Export GeoTIFF or CSV.',
  {fontSize:'12px', color:'gray', whiteSpace: 'pre-wrap'}
));

// Dropdowns
var sa4Select = ui.Select({placeholder:'Select SA4'});
var layerSelect = ui.Select({
  items:['LST', 'NDVI', 'AlphaEarth'],
  value:'LST'
});

panel.add(ui.Label('Select SA4:'));
panel.add(sa4Select);

panel.add(ui.Label('Select Layer:'));
panel.add(layerSelect);

// Buttons
var runBtn = ui.Button('Run Analysis');
var expImgBtn = ui.Button('Export GeoTIFF');
var expCsvBtn = ui.Button('Export CSV');

panel.add(runBtn);
panel.add(expImgBtn);
panel.add(expCsvBtn);

// Output
var msg = ui.Label('', {color:'red'});
var clickInfo = ui.Label('Click map for exact value', {fontWeight: 'bold', color: 'blue'});
panel.add(msg);
panel.add(clickInfo);

// 4. LEGEND
var legend = ui.Panel({style:{position:'bottom-left'}});
Map.add(legend);

function makeColorBar(palette){
  return ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params:{bbox:[0,0,1,0.1], dimensions:'100x10', min:0, max:1, palette:palette},
    style:{stretch:'horizontal'}
  });
}

// 5. FUNCTIONS

// LST Calculation
function getLST(aoi, start, end){
  return ee.ImageCollection(MODIS)
    .filterBounds(aoi)
    .filterDate(start, end)
    .map(function(img){
      return img.select(BAND_LST)
        .multiply(0.02)
        .subtract(273.15)
        .rename('LST');
    })
    .median()
    .clip(aoi);
}

// NDVI Calculation
function getNDVI(aoi, start, end){
  var img = ee.ImageCollection(S2)
    .filterBounds(aoi)
    .filterDate(start, end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',15))
    .median()
    .clip(aoi);

  return img.normalizedDifference(['B8','B4']).rename('NDVI');
}

// AlphaEarth
function getEmbedding(aoi){
  return ee.ImageCollection(EMBEDDING)
    .filterDate('2024-01-01','2025-01-01')
    .filterBounds(aoi)
    .mosaic()
    .clip(aoi);
}

// Zonal stats
function zonalStats(image, scale){
  return image.reduceRegions({
    collection: SA2.filterBounds(lastGeom),
    reducer: ee.Reducer.mean(),
    scale: scale
  });
}

// 6. STATE
var lastImage = null;
var lastBand = null;
var lastScale = null;
var lastGeom = null;

// Populate SA4
SA2.aggregate_array(FIELD_SA4).distinct().sort().evaluate(function(list){
  sa4Select.items().reset(list);
});

// Select region
sa4Select.onChange(function(name){
  var fc = SA2.filter(ee.Filter.eq(FIELD_SA4, name));
  lastGeom = fc.geometry();
  Map.centerObject(lastGeom, 10);
});

// 7. RUN EVENT HANDLER
runBtn.onClick(function(){

  if (!lastGeom){
    msg.setValue('Select SA4 first');
    return;
  }

  msg.setValue('Processing...');
  Map.layers().reset();
  legend.clear();

  var choice = layerSelect.getValue();

  if (choice === 'LST'){
    lastImage = getLST(lastGeom, START_DATE, END_DATE);
    lastBand = 'LST';
    lastScale = SCALE_LST;
    Map.addLayer(lastImage, {min:7.0, max:47.0, palette:LST_PALETTE});
    legend.add(ui.Label('LST °C'));
    legend.add(makeColorBar(LST_PALETTE));

  } else if (choice === 'NDVI'){
    lastImage = getNDVI(lastGeom, START_DATE, END_DATE);
    lastBand = 'NDVI';
    lastScale = SCALE_NDVI;
    Map.addLayer(lastImage, {min:0, max:1, palette:NDVI_PALETTE});
    legend.add(ui.Label('NDVI'));
    legend.add(makeColorBar(NDVI_PALETTE));

  } else {
    lastImage = getEmbedding(lastGeom);
    lastBand = 'A01'; 
    lastScale = 10;

    Map.addLayer(lastImage, {
      bands:['A01','A16','A09'],
      min:-0.3,
      max:0.3
    }, 'Embedding RGB');

    legend.add(ui.Label('AlphaEarth Embedding'));
  }
  
  // Add clean boundary outline
  var outlineSa4 = ee.Image().paint(SA2.filterBounds(lastGeom), 0, 2);
  Map.addLayer(outlineSa4, {palette:'yellow'}, 'SA4 boundary');

  msg.setValue('Done ✔');
});

// 8. EXPORTS
expImgBtn.onClick(function(){
  if (!lastImage) return;

  var url = lastImage.getDownloadURL({
    region:lastGeom,
    scale:lastScale,
    format:'GEO_TIFF'
  });

  panel.add(ui.Label('Download GeoTIFF', {fontWeight: 'bold'}));
  panel.add(ui.Label('Click here', null, url));
});

expCsvBtn.onClick(function(){
  if (!lastImage) return;

  var table = zonalStats(lastImage, lastScale);
  var url = table.getDownloadURL({format:'CSV'});

  panel.add(ui.Label('Download CSV', {fontWeight: 'bold'}));
  panel.add(ui.Label('Click here', null, url));
});

// 9. CLICK INFO
Map.onClick(function(coords){

  if (!lastImage) return;
  clickInfo.setValue('Calculating...');

  var point = ee.Geometry.Point([coords.lon, coords.lat]);

  var val = lastImage.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: point,
    scale: lastScale
  }).get(lastBand);

  val.evaluate(function(v){
    if (v !== null){
      clickInfo.setValue(lastBand + ': ' + v.toFixed(2));
    } else {
      clickInfo.setValue('No data/outside bounds');
    }
  });

});

```
---

# Part 2: Cesium App
Link in description

