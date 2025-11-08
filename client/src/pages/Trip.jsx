import React, { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import USMap from "../components/trips/USMap.jsx";
import TripFormModal from "../components/trips/TripFormModal.jsx";
import TripAccordion from "../components/trips/TripAccordion.jsx";

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
    // const handleAddTrip = (newTrip) => {
    //     setTrips((prev) => [...prev, {id: prev.length + 1, ...newTrip }]);
    //     setShowTripForm(false);
    // };

    // const handleAddTrip = async (newTrip) => {
    //     try {
    //         const response = await fetch(`/api/trips/userId/${userId}`, {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //             body: JSON.stringify(newTrip),
    //         });
    //         if (!response.ok) {
    //             throw new Error("Failed to add trip");
    //         }
    //         const savedTrip = await response.json();
    //         setTrips((prev) => [...prev, savedTrip]);
    //         setSelectedTrip(null); // Clear selected trip after adding
    //     } catch (error) {
    //         console.error("Error adding trip:", error);
    //     }
    // };

    const handleEditTrip = (trip) => {
        console.log("Editing trip:", trip);
        setSelectedTrip(trip);
        setShowTripForm(true);
    };

    const handleSaveTrip = async (trip) => {
        try {
            let savedTrip;
            console.log("Saving trip:", trip._id); // DEBUG
            if (trip._id) {
                // Edit existing trip
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
        setTrips((prev) => prev.filter((t) => t._id !== trip._id));
    };

    return (
        <div className="trip-page container my-4">
            <h1 className="mb-4">My Trips</h1>

            {/* SVG Map Component */}
            <div className="mb-4">
                <USMap />
            </div>

            {/* Button to open Trip Form Modal */}
            <Button variant="primary" onClick={() => setShowTripForm(true)}>
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