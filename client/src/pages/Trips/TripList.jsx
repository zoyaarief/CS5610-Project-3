import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
export default function TripList() {
  const [trips, setTrips] = useState([]);
  useEffect(() => {
    // Temporary mock data until Stewart’s API is ready
    setTrips([
      {
        id: 1,
        name: "California Adventure",
        states: ["CA", "NV"],
        cost: 1250,
        year: 2024,
      },
      {
        id: 2,
        name: "East Coast Roadtrip",
        states: ["NY", "NJ", "PA"],
        cost: 900,
        year: 2023,
      },
    ]);
  }, []);
  return (
    <div className="card">
      <h2>My Trips</h2>
      <Link to="/trips/new">➕ Add trip</Link>
      <ul>
        {trips.map((t) => (
          <li key={t.id}>
            <Link to={`/trips/${t.id}`}>{t.name}</Link> ({t.year}) –{" "}
            {t.states.length} states, ${t.cost}
          </li>
        ))}
      </ul>
    </div>
  );
}
