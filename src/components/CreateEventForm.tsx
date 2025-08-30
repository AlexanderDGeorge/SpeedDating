import { useState, type FormEvent } from "react";
import { auth } from "../firebase";
import { createEvent } from "../firebase/event";
import Button from "./Button";

interface CreateEventFormProps {
  onEventCreated: () => void;
  onCancel: () => void;
}

export default function CreateEventForm({ onEventCreated, onCancel }: CreateEventFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [maleCapacity, setMaleCapacity] = useState("");
  const [femaleCapacity, setFemaleCapacity] = useState("");
  const [ageRangeMin, setAgeRangeMin] = useState("");
  const [ageRangeMax, setAgeRangeMax] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateEvent = async (e: FormEvent<HTMLFormElement>) => {
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
      const maleCapacityNum = parseInt(maleCapacity);
      const femaleCapacityNum = parseInt(femaleCapacity);
      const ageRangeMinNum = parseInt(ageRangeMin);
      const ageRangeMaxNum = ageRangeMax ? parseInt(ageRangeMax) : undefined;

      if (isNaN(maleCapacityNum) || maleCapacityNum < 2) {
        setError("Male capacity must be at least 2");
        setLoading(false);
        return;
      }

      if (isNaN(femaleCapacityNum) || femaleCapacityNum < 2) {
        setError("Female capacity must be at least 2");
        setLoading(false);
        return;
      }

      if (isNaN(ageRangeMinNum) || ageRangeMinNum < 18) {
        setError("Minimum age must be at least 18");
        setLoading(false);
        return;
      }

      if (ageRangeMaxNum !== undefined && (isNaN(ageRangeMaxNum) || ageRangeMinNum >= ageRangeMaxNum)) {
        setError("Maximum age must be greater than minimum age");
        setLoading(false);
        return;
      }


      // Create event object
      const eventData: any = {
        title: title.trim(),
        description: description.trim(),
        date,
        startTime,
        maleCapacity: maleCapacityNum,
        femaleCapacity: femaleCapacityNum,
        ageRangeMin: ageRangeMinNum,
        registrationDeadline,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        status: 'upcoming' as const
      };
      
      // Only add ageRangeMax if it's provided
      if (ageRangeMaxNum !== undefined) {
        eventData.ageRangeMax = ageRangeMaxNum;
      }

      // Save to Firestore
      await createEvent(eventData);

      // Reset form
      setTitle("");
      setDescription("");
      setDate("");
      setStartTime("");
      setMaleCapacity("");
      setFemaleCapacity("");
      setAgeRangeMin("");
      setAgeRangeMax("");
      setRegistrationDeadline("");
      
      // Notify parent component
      onEventCreated();
    } catch (err) {
      console.error("Error creating event:", err);
      setError("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-cream p-6 rounded-lg mb-6">
      <h3 className="text-xl font-bold text-navy mb-4">Create New Event</h3>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleCreateEvent} className="space-y-4">
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
            className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none resize-none input-focus"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
              Male Capacity *
            </label>
            <input
              className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none"
              type="number"
              placeholder="10"
              min="2"
              max="50"
              value={maleCapacity}
              onChange={(e) => setMaleCapacity(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
              Female Capacity *
            </label>
            <input
              className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none"
              type="number"
              placeholder="10"
              min="2"
              max="50"
              value={femaleCapacity}
              onChange={(e) => setFemaleCapacity(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              Max Age (optional)
            </label>
            <input
              className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none"
              type="number"
              placeholder="35"
              min="18"
              max="100"
              value={ageRangeMax}
              onChange={(e) => setAgeRangeMax(e.target.value)}
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
            Create Event
          </Button>
        </div>
      </form>
    </div>
  );
}