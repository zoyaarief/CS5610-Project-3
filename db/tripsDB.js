import { connect } from "./index.js";
import { ObjectId } from "mongodb";

const COLLECTION = "trips";

// Create/insert a new trip
export async function createTrip(doc) {
  const { client, db } = connect();
  const trips = db.collection(COLLECTION);

  try {
    doc.createdAt = new Date();
    doc.updatedAt = new Date();

    const res = await trips.insertOne(doc);
    return await trips.findOne({ _id: res.insertedId });
  } finally {
    await client.close();
  }
}

// Get all trips for a specific user
export async function getTrips({
  userId,
  tripId,
  pageSize = 20,
  page = 0,
} = {}) {
  const { client, db } = connect();
  const trips = db.collection(COLLECTION);
  const filter = {};
  if (userId) filter.userId = userId;
  if (tripId) filter.tripId = tripId;

  try {
    return await trips
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * page)
      .toArray();
  } finally {
    await client.close();
  }
}

// Get a specific trip by its ID
export async function getTrip(tripId) {
  const { client, db } = connect();
  const trips = db.collection(COLLECTION);

  try {
    return await trips.findOne({ _id: tripId });
  } finally {
    await client.close();
  }
}

// Update a specific trip by its ID
export async function updateTrip(tripId, updates) {
  const { client, db } = connect();
  const trips = db.collection(COLLECTION);

  //console.log("Updating trip:", tripId, updates);
  try {
    updates.updatedAt = new Date();

    const result = await trips.findOneAndUpdate(
      { _id: tripId },
      { $set: updates },
      { returnDocument: "after" },
    );
    //console.log("Updated trip result:", result);
    return result;
  } finally {
    await client.close();
  }
}

// Delete a specific trip by its ID
export async function deleteTrip(tripId) {
  const { client, db } = connect();
  const trips = db.collection(COLLECTION);

  try {
    const result = await trips.deleteOne({ _id: tripId });
    return result.deletedCount === 1;
  } finally {
    await client.close();
  }
}

//Legs CRUD

// Add a leg to a specific trip
export async function addLegToTrip(tripId, leg) {
  const { client, db } = connect();
  const trips = db.collection(COLLECTION);

  try {
    const result = await trips.findOneAndUpdate(
      { _id: tripId },
      { $push: { legs: leg }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    return result;
  } finally {
    await client.close();
  }
}

// Get all legs for a specific trip
export async function getLegs(tripId) {
  const { client, db } = connect();
  const trips = db.collection(COLLECTION);

  try {
    const trip = await trips.findOne(
      { _id: new ObjectId(tripId) },
      { projection: { legs: 1 } },
    );
    return trip?.legs || [];
  } finally {
    await client.close();
  }
}

// Update a leg by its ID within a specific trip
export async function updateLeg(tripId, legId, updates) {
  const { client, db } = connect();
  const trips = db.collection(COLLECTION);

  try {
    const result = await trips.findOneAndUpdate(
      { _id: new ObjectId(tripId), "legs._id": new ObjectId(legId) },
      {
        $set: Object.fromEntries(
          Object.entries(updates).map(([key, value]) => [
            `legs.$.${key}`,
            value,
          ]),
        ),
      },
      { returnDocument: "after" },
    );
    return result.value;
  } finally {
    await client.close();
  }
}

// Delete a leg by its ID within a specific trip
export async function deleteLeg(tripId, legId) {
  const { client, db } = connect();
  const trips = db.collection(COLLECTION);

  try {
    const result = await trips.findOneAndUpdate(
      { _id: tripId },
      { $pull: { legs: { _id: legId } } },
      { returnDocument: "after" },
    );
    return result;
  } finally {
    await client.close();
  }
}
