import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./css/main.css";
// Grant CesiumJS access to your ion assets
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwOGVjYTg0NS0xZmFhLTQxYTEtODk4OS0yYmZmYTJhNGQ4NjIiLCJpZCI6NDA3NjQxLCJpYXQiOjE3NzQyMzYwMzV9.8MK5_yti5DKMaPYim9Vmf0FT_gAA4R05taT5QpIWdKs";

// Define the viewer
const viewer = new Cesium.Viewer("cesiumContainer");

// async function required outside sandbox
async function main() {


  // Google Photorealistic 3D Tiles
  try {
    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(2275207);
    viewer.scene.primitives.add(tileset);
    await viewer.zoomTo(tileset);
  } catch (error) {
    console.log(error);
  }

  // Lilydale_to_Warburton_Rail_Trail (LINE)
  try {
    const resource = await Cesium.IonResource.fromAssetId(4716533);

    const dataSource = await Cesium.GeoJsonDataSource.load(resource, {
      clampToGround: true,
    });

    // Style as thick white line
    dataSource.entities.values.forEach(entity => {
      if (entity.polyline) {
        entity.polyline.width = 5;
        entity.polyline.material = Cesium.Color.WHITE;
        entity.polyline.clampToGround = true;
      }
    });

    await viewer.dataSources.add(dataSource);
    await viewer.zoomTo(dataSource);

  } catch (error) {
    console.log(error);
  }

  
  // Lilydale_to_Warburton_Rail_Trail_Waypoints
  try {
    const resource = await Cesium.IonResource.fromAssetId(4716535);

    const dataSource = await Cesium.GeoJsonDataSource.load(resource, {
      clampToGround: true,
    });

    dataSource.entities.values.forEach(entity => {
      const name = entity.properties?.Name?.getValue() || '';
      let pointColor = Cesium.Color.YELLOW;

      if (name.includes('Car park')) {
        pointColor = Cesium.Color.GREY;
      } else if (name.includes('Toilet')) {
        pointColor = Cesium.Color.BLUE;
      } else if (name.includes('Picnic table')) {
        pointColor = Cesium.Color.GREEN;
      } else if (name.includes('Station')) {
        pointColor = Cesium.Color.YELLOW;
      } else if (name.includes('Cafe')) {
        pointColor = Cesium.Color.PINK;
      } else if (name.includes('Tunnel')) {
        pointColor = Cesium.Color.PURPLE;
      } else if (name.includes('Bridge')) {
        pointColor = Cesium.Color.PURPLE;
      }

      entity.point = new Cesium.PointGraphics({
        color: pointColor,
        pixelSize: 12,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1
      });

      entity.billboard = undefined;
    });

    await viewer.dataSources.add(dataSource);

  } catch (error) {
    console.log(error);
  }


// LEGEND UI
const legendContainer = document.createElement('div');

legendContainer.style.position = 'absolute';
legendContainer.style.top = '180px';
legendContainer.style.left = '10px';
legendContainer.style.zIndex = '999';
legendContainer.style.backgroundColor = 'rgba(0,0,0,0.5)';
legendContainer.style.padding = '10px';
legendContainer.style.borderRadius = '5px';
legendContainer.style.color = 'white';
legendContainer.style.fontFamily = 'Arial, sans-serif';

legendContainer.innerHTML = `
  <div><strong>Legend</strong></div>
  <div><span style="color: white;">━</span> Rail Trail</div>
  <div><span style="color: grey;">●</span> Car park</div>
  <div><span style="color: blue;">●</span> Toilet</div>
  <div><span style="color: green;">●</span> Picnic tables</div>
  <div><span style="color: yellow;">●</span> Station</div>
  <div><span style="color: Pink;">●</span> Cafe</div>
  <div><span style="color: Purple;">●</span> Tunnels & Bridges</div>
`;

viewer.container.appendChild(legendContainer);

  
  // WEATHER UI (FROM PRACTICAL)
  // Create container
  const weatherContainer = document.createElement('div');
  weatherContainer.style.position = 'absolute';
  weatherContainer.style.top = '10px';
  weatherContainer.style.left = '10px';
  weatherContainer.style.zIndex = '999';
  weatherContainer.style.backgroundColor = 'rgba(0,0,0,0.5)';
  weatherContainer.style.padding = '10px';
  weatherContainer.style.borderRadius = '5px';
  weatherContainer.style.color = 'white';
  weatherContainer.style.fontFamily = 'Arial, sans-serif';

  viewer.container.appendChild(weatherContainer);

  // Button
  const weatherButton = document.createElement('button');
  weatherButton.textContent = 'Get Current Weather - Lilydale';
  weatherButton.style.marginBottom = '10px';
  weatherButton.style.marginTop = '10px';
  weatherButton.style.padding = '5px 10px';
  weatherButton.style.cursor = 'pointer';

  weatherContainer.appendChild(weatherButton);

  // Info display
  const weatherInfo = document.createElement('div');
  weatherInfo.id = 'weatherInfo';

  weatherContainer.appendChild(weatherInfo);

  // Function 
  async function fetchWeatherData() {
    try {
      weatherButton.disabled = true;
      weatherButton.textContent = 'Fetching weather data...';

      const response = await fetch(
        "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/Lilydale%2C%20Victoria?unitGroup=metric&include=current&key=MQJWA6DSANXBSDN37CREY2Q2T&contentType=json"
      );

      const data = await response.json();

      weatherInfo.innerHTML = `
        <div><strong>Time:</strong> ${data.currentConditions.datetime}</div>
        <div><strong>Conditions:</strong> ${data.currentConditions.conditions}</div>
        <div><strong>Temperature:</strong> ${data.currentConditions.temp}°C</div>
        <div><strong>Rainfall:</strong> ${data.currentConditions.precip}mm</div>
        <div><strong>Chance of Rainfall:</strong> ${data.currentConditions.precipprob}%</div>
      `;

      weatherButton.textContent = 'Refresh Weather';

    } catch (error) {
      weatherInfo.textContent = 'Error fetching weather data';
      console.error(error);
    } finally {
      weatherButton.disabled = false;
    }
  }

  // Click event
  weatherButton.addEventListener('click', fetchWeatherData);
}

// Run the app
main();