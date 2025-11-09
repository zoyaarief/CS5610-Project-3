import React, { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import USMap from "../components/trips/USMap.jsx";
import TripFormModal from "../components/trips/TripFormModal.jsx";
import TripAccordion from "../components/trips/TripAccordion.jsx";

function getVisitedStates(trips) {
    const states = new Set();
    trips.forEach((trip) => {
        trip.legs.forEach((leg) => {
            if (leg.state) states.add(leg.state);
        });
    });
    return Array.from(states);
}

export default function Trip() {
    const [showTripForm, setShowTripForm] = useState(false);
    const [trips, setTrips] = useState([]);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const userId = "testUserId"; // Replace with actual user ID from auth context

    useEffect(() => {
        async function loadTrips() {
            try {
                const res = await fetch(`/api/trips?userId=${userId}`);
                const data = await res.json();
                console.log("Fetched trips:", data); // DEBUG
                setTrips(data);
            } catch (error) {
                console.error("Error fetching trips:", error);
            }
        }
        loadTrips();
    }, []);

    const handleEditTrip = (trip) => {
        console.log("Editing trip:", trip);
        setSelectedTrip(trip);
        setShowTripForm(true);
    };

    const handleSaveTrip = async (trip) => {
        try {
            let savedTrip;
            if (trip._id) {
                // Edit existing trip
                console.log("Saving trip:", trip._id); // DEBUG
                const response = await fetch(`/api/trips/${trip._id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(trip),
                });
                savedTrip = await response.json();
                setTrips((prev) =>
                    prev.map((t) => (t._id === savedTrip._id ? savedTrip : t))
                );
            } else {
                // Add new trip
                console.log("Adding new trip", trip); // DEBUG
                const response = await fetch(`/api/trips/userId/${userId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(trip),
                });
                savedTrip = await response.json();
                setTrips((prev) => [...prev, savedTrip]);
            }
            setSelectedTrip(null); // Clear selected trip after saving
            setShowTripForm(false);
        } catch (error) {
            console.error("Error saving trip:", error);
        }
    };

    const handleDeleteTrip = (trip) => {
        if(!window.confirm(`Delete trip "${trip.title}"? This action cannot be undone.`)) return;
        console.log("Deleting trip:", trip._id);
        try {
            fetch(`/api/trips/${trip._id}`, {
                method: "DELETE",
            }).then((res) => {
                if (res.ok) {
                    setTrips((prev) => prev.filter((t) => t._id !== trip._id));
                } else {
                    console.error("Failed to delete trip");
                }
            });
        } catch (error) {
            console.error("Error deleting trip:", error);
        }
    };

    const visitedStates = getVisitedStates(trips);
    console.log("Visited states:", visitedStates); // DEBUG

    return (
        <div className="trip-page container my-4">
            <h1 className="mb-4">My Trips</h1>

            {/* SVG Map Component */}
            <div className="mb-4">
                <USMap visitedStates={visitedStates}/>
            </div>

            {/* Button to open Trip Form Modal */}
            <Button variant="primary" onClick={() => {
                setSelectedTrip(null);
                setShowTripForm(true);
            }}>
                +
                Add New Trip
            </Button>

            {/* Trip Form Modal */}
            <TripFormModal
                show={showTripForm}
                onHide={() => setShowTripForm(false)}
                onSave={handleSaveTrip}
                initialData={selectedTrip}
            />

            {/* Trip Accordion Component */}
            <div className="mt-4">
                <TripAccordion trips={trips}
                onEdit={handleEditTrip}
                onDelete={handleDeleteTrip}
                />
            </div>
        </div>
    );
}