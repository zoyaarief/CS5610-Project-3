import React from "react";
import { useParams, Link } from "react-router-dom";
import states from "../data/states.json";

export default function StateDetail() {
  const { code } = useParams();
  const s = states.find(
    (x) => x.code.toLowerCase() === String(code).toLowerCase()
  );

  if (!s) {
    return (
      <div className="card" style={{ margin: "2rem auto", maxWidth: 640 }}>
        <p>
          State not found. <Link to="/states">Back to list</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ margin: "2rem auto", maxWidth: 640 }}>
      <h2>
        {s.name} ({s.code})
      </h2>
      {s.capital && (
        <p>
          <strong>Capital:</strong> {s.capital}
        </p>
      )}
      {s.region && (
        <p>
          <strong>Region:</strong> {s.region}
        </p>
      )}
      {s.nickname && (
        <p>
          <strong>Nickname:</strong> {s.nickname}
        </p>
      )}
      <p>
        <Link to="/states">← Back to states</Link>
      </p>
    </div>
  );
}
