import mapboxgl from "mapbox-gl";
import React, { useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = "pk.eyJ1Ijoic2FsbWVpZGExOTkzIiwiYSI6ImNtaGxmcDc1bTAwNnAycHE0MHBzMjQyeW4ifQ.CyQk_2C7_6cSQjidPsgjEA";

export default function USMap({ visitedStates }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-98.5795, 39.8283],
      zoom: 3,
    });
    map.current.on("load", () => {
      map.current.addSource("states", {
        type: "vector",
        url: "mapbox://mapbox.us_states_2015_vector",
      });
      map.current.addLayer({
        id: "state-fills",
        type: "fill",
        source: "states",
        "source-layer": "state_2015",
        paint: {
          "fill-color": [
            "match",
            ["get", "STATE_ABBR"],
            ...visitedStates.flatMap(code => [code, "#3CB043"]),
            "#E0E0E0" // default color
          ],
          "fill-opacity": 0.7,
        },
      });
      map.current.addLayer({
        id: "state-borders",
        type: "line",
        source: "states",
        "source-layer": "state_2015",
        paint: {
          "line-color": "#FFFFFF",
          "line-width": 2,
        },
      });
    });
  }, []);

  useEffect(() => {
    if (!map.current || !map.current.getLayer("state-fills")) return;

    map.current.setPaintProperty("state-fills", "fill-color", [
      "match",
      ["get", "STATE_ABBR"],
      ...visitedStates.flatMap(code => [code, "#3CB043"]),
      "#E0E0E0"
    ]);
  }, [visitedStates]);

  return (
    <div
      ref={mapContainer}
      aria-label="US Map showing visited states"
      style={{ width: "100%", height: "500px", borderRadius: "8px" }}
    />
  );
}
