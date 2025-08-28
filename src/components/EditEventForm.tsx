import { useState, useEffect, type FormEvent } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import Button from "./Button";
import type { SpeedDatingEvent } from "../types/event";

interface EditEventFormProps {
  event: SpeedDatingEvent;
  onEventUpdated: () => void;
  onCancel: () => void;
}

export default function EditEventForm({ event, onEventUpdated, onCancel }: EditEventFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [ageRangeMin, setAgeRangeMin] = useState("");
  const [ageRangeMax, setAgeRangeMax] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setDate(event.date);
      setStartTime(event.startTime);
      setMaxParticipants(event.maxParticipants.toString());
      setAgeRangeMin(event.ageRangeMin.toString());
      setAgeRangeMax(event.ageRangeMax.toString());
      setRegistrationDeadline(event.registrationDeadline);
    }
  }, [event]);

  const handleUpdateEvent = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      // Validate form data
      const maxParticipantsNum = parseInt(maxParticipants);
      const ageRangeMinNum = parseInt(ageRangeMin);
      const ageRangeMaxNum = parseInt(ageRangeMax);

      if (isNaN(maxParticipantsNum) || maxParticipantsNum < 4) {
        setError("Maximum participants must be at least 4");
        setLoading(false);
        return;
      }

      if (isNaN(ageRangeMinNum) || isNaN(ageRangeMaxNum) || ageRangeMinNum >= ageRangeMaxNum) {
        setError("Please enter valid age range");
        setLoading(false);
        return;
      }


      // Update event object
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        date,
        startTime,
        maxParticipants: maxParticipantsNum,
        ageRangeMin: ageRangeMinNum,
        ageRangeMax: ageRangeMaxNum,
        registrationDeadline,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      };

      // Update in Firestore
      await updateDoc(doc(db, "events", event.id), eventData);

      // Notify parent component
      onEventUpdated();
    } catch (err) {
      console.error("Error updating event:", err);
      setError("Failed to update event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-cream p-6 rounded-lg mb-6">
      <h3 className="text-xl font-bold text-navy mb-4">Edit Event</h3>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleUpdateEvent} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
              Event Title *
            </label>
            <input
              className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none input-focus"
              type="text"
              placeholder="e.g., Singles Night at The Bus Stop"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
            Description (optional)
          </label>
          <textarea
            className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none resize-none"
            rows={3}
            placeholder="Brief description of the event..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
              Event Date *
            </label>
            <input
              className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none input-focus"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
              Start Time *
            </label>
            <input
              className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none input-focus"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              step="300"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
              Max Participants *
            </label>
            <input
              className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none"
              type="number"
              placeholder="20"
              min="4"
              max="100"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
              Min Age *
            </label>
            <input
              className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none"
              type="number"
              placeholder="18"
              min="18"
              max="99"
              value={ageRangeMin}
              onChange={(e) => setAgeRangeMin(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
              Max Age *
            </label>
            <input
              className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none"
              type="number"
              placeholder="35"
              min="18"
              max="100"
              value={ageRangeMax}
              onChange={(e) => setAgeRangeMax(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
            Registration Deadline *
          </label>
          <input
            className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none"
            type="date"
            value={registrationDeadline}
            onChange={(e) => setRegistrationDeadline(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            fullWidth
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="secondary"
            size="lg"
            fullWidth
            disabled={loading}
            loading={loading}
          >
            Update Event
          </Button>
        </div>
      </form>
    </div>
  );
}