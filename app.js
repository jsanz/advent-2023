/* Imports*/
import maplibregl from 'https://cdn.skypack.dev/maplibre-gl@3.6.2';

/* Constants */
const style = "https://api.maptiler.com/maps/winter-v2/style.json?key=NvqxPDDcpkBvs6vxYpGR ";
/* ES instance with geodata and anonymous access enabled */
const ES_HOST = "https://jorge-sanz.es.eastus2.azure.elastic-cloud.com";
/* ES API Key to access our data */
const ES_APIKEY = "dXBFVk80d0JaNEs5cUE1YlRRX3U6Qnl4Ynp5NkVTNzZud2kxa3V5bEZ2Zw==";
/* ES index and geometry field */
const ES_INDEX = "overture_places";
const ES_FIELD = "location";
/* Vector Tile request is composed with host, index, and field */
const ES_TILES = `${ES_HOST}/${ES_INDEX}/_mvt/${ES_FIELD}/{z}/{x}/{y}`;
/* Default query */
const DEFAULT_QUERY = "Santa Claus";


const getDynamicTransFormRequest = function (url, resourceType) {
  /* This function enriches the HTTP request to include
              the ES search body, change to a POST request, and include
              the Content-Type header */
  if (resourceType == "Tile" && url.startsWith(ES_HOST)) {
    const query = document.getElementById("search").value || DEFAULT_QUERY;
    
    /* Build a VT query payload */
    const body = {
      grid_precision: 0,
      exact_bounds: true,
      extent: 4096,
      fields: ["name", "category_main", "category_alt", "source", "social"],
      query: {
        bool: {
          filter: [
            {
              multi_match: {
                lenient: true,
                query: `*${query}*`,
                type: "phrase",
              },
            },
          ],
        },
      },
    }

    return {
      url: url,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `ApiKey ${ES_APIKEY}`,
      },
      body: JSON.stringify(body),
    };
  }
};



const run = function () {

    // Set the search placeholder
  document.getElementById("search").placeholder = DEFAULT_QUERY;

  // Event to reload the map to update the body payload
  document.getElementById("btn_search").addEventListener("click", function (e) {
    map.getSource("ES").setTiles([ES_TILES]);
  });


  const map = new maplibregl.Map({
    container: "map",
    style,
    center: [0, 15],
    zoom: 1,
    hash: true,
    transformRequest: getDynamicTransFormRequest,
  });

  map.addControl(new maplibregl.NavigationControl());

  map.on("load", function () {
    /* Source for ES data */
    map.addSource("ES", {
      type: "vector",
      tiles: [ES_TILES],
      minzoom: 0,
      maxzoom: 14,
      attribution: '<a href="https://overturemaps.org/">&copy; Overture Maps</a>',
    });

    map.addLayer({
      id: "data",
      type: "circle",
      source: "ES",
      "source-layer": "hits",
      paint: {
        "circle-radius": 5,
        /* Thematic mapping for the category_main field */
        "circle-color": [
          "match",
          ["get", "category_main"],
          "beauty_salon",
          "#54B399",
          "hotel",
          "#6092C0",
          "lodge",
          "#6092C0",
          "accommodation",
          "#6092C0",
          "landmark_and_historical_building",
          "#D36086",
          "monument",
          "#D36086",
          "park",
          "#D36086",
          "beach",
          "#D36086",
          "amusement_park",
          "#D36086",
          "professional_services",
          "#9170B8",
          "automotive_repair",
          "#9170B8",
          "real_estate",
          "#9170B8",
          "gym",
          "#9170B8",
          "active_life",
          "#9170B8",
          "grocery_store",
          "#9170B8",
          "shopping",
          "#CA8EAE",
          "shopping_center",
          "#CA8EAE",
          "clothing_store",
          "#CA8EAE",
          "restaurant",
          "#D6BF57",
          "cafe",
          "#D6BF57",
          "bar",
          "#D6BF57",
          "coffee_shop",
          "#D6BF57",
          "topic_concert_venue",
          "#D6BF57",
          "school",
          "#B9A888",
          "college_university",
          "#B9A888",
          "hospital",
          "#DA8B45",
          "dentist",
          "#DA8B45",
          "public_and_government_association",
          "#DA8B45",
          "charity_organization",
          "#DA8B45",
          "community_services_non_profits",
          "#DA8B45",
          "church_cathedral",
          "#AA6556",
          "religious_organization",
          "#AA6556",
          /*other*/ "#ccc",
        ],
        "circle-opacity": 0.9,
        "circle-stroke-width": 2,
        "circle-stroke-color": "rgba(0, 0, 0, 0.9)",
      },
    });

    /* A very simple pop up implementation */
    map.on("click", "data", function (e) {
      const feature = e.features[0];
      const { category_main, category_alt, source, social } = feature.properties;

      var coordinates = feature.geometry.coordinates.slice();
      var description = `
                  <hgroup>
                      <h3>${feature.properties["name"]}</h3>
                  </hgroup>
                  <ul>
                      <li><strong>Type</strong>: ${ category_main|| "N/A"}</li>
                      <li><strong>Subtype</strong>: ${ category_alt || "N/A"}</li>
                      <li><strong>Source</strong>: ${ source }</li>
                      <li><a href="${social || ""}">Social</a></li>
                  </ul>
              `;

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      new maplibregl.Popup({maxWidth: "300px"})
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map);
    });
    /* change cursor on hover */
    map.on("mouseenter", "data", function () {
      map.getCanvas().style.cursor = "pointer";
    });
    /* reset cursor when leaving a feature */
    map.on("mouseleave", "data", function () {
      map.getCanvas().style.cursor = "";
    });
  });
};

document.addEventListener('DOMContentLoaded', run);