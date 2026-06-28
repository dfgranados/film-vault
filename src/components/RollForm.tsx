"use client";

import { useEffect, useState } from "react";
import type { Camera, FilmStock, Location } from "@/types";

interface RollFormProps {
  initial?: {
    title?: string;
    shotDate?: string;
    notes?: string;
    status?: string;
    cameraId?: string;
    filmStockId?: string;
    locationId?: string;
    shotIso?: number | null;
  };
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  submitLabel?: string;
}

export function RollForm({
  initial,
  onSubmit,
  submitLabel = "Create Roll",
}: RollFormProps) {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [films, setFilms] = useState<FilmStock[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewCamera, setShowNewCamera] = useState(false);
  const [showNewFilm, setShowNewFilm] = useState(false);
  const [showNewLocation, setShowNewLocation] = useState(false);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [shotDate, setShotDate] = useState(
    initial?.shotDate ?? new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [status, setStatus] = useState(initial?.status ?? "planned");
  const [cameraId, setCameraId] = useState(initial?.cameraId ?? "");
  const [filmStockId, setFilmStockId] = useState(initial?.filmStockId ?? "");
  const [locationId, setLocationId] = useState(initial?.locationId ?? "");
  const [shotIso, setShotIso] = useState(
    initial?.shotIso != null ? String(initial.shotIso) : "",
  );

  const [newCamera, setNewCamera] = useState({ name: "", lens: "" });
  const [newFilm, setNewFilm] = useState({
    brand: "",
    name: "",
    iso: "",
    type: "color",
  });
  const [newLocation, setNewLocation] = useState({ name: "", parentId: "" });

  useEffect(() => {
    const initialFilmId = initial?.filmStockId;
    Promise.all([
      fetch("/api/cameras").then((r) => r.json()),
      fetch("/api/film-stocks").then((r) => r.json()),
      fetch("/api/locations").then((r) => r.json()),
    ]).then(([c, f, l]) => {
      setCameras(c);
      setFilms(f);
      setLocations(l);
      if (initialFilmId && initial?.shotIso == null) {
        const film = f.find((item: FilmStock) => item.id === initialFilmId);
        if (film?.iso != null) setShotIso(String(film.iso));
      }
    });
  }, [initial?.filmStockId, initial?.shotIso]);

  function selectFilmStock(id: string) {
    setFilmStockId(id);
    if (!id) {
      setShotIso("");
      return;
    }
    const film = films.find((f) => f.id === id);
    setShotIso(film?.iso != null ? String(film.iso) : "");
  }

  async function createCamera() {
    const res = await fetch("/api/cameras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCamera),
    });
    const camera = await res.json();
    setCameras((prev) => [...prev, camera]);
    setCameraId(camera.id);
    setShowNewCamera(false);
    setNewCamera({ name: "", lens: "" });
  }

  async function createFilm() {
    const res = await fetch("/api/film-stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newFilm,
        iso: newFilm.iso ? Number(newFilm.iso) : null,
      }),
    });
    const film = await res.json();
    setFilms((prev) => [...prev, film]);
    setFilmStockId(film.id);
    setShotIso(film.iso != null ? String(film.iso) : "");
    setShowNewFilm(false);
    setNewFilm({ brand: "", name: "", iso: "", type: "color" });
  }

  async function createLocation() {
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newLocation.name,
        parentId: newLocation.parentId || null,
      }),
    });
    const location = await res.json();
    setLocations((prev) => [...prev, location]);
    setLocationId(location.id);
    setShowNewLocation(false);
    setNewLocation({ name: "", parentId: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        title,
        shotDate,
        notes: notes || null,
        status,
        cameraId: cameraId || null,
        filmStockId: filmStockId || null,
        locationId: locationId || null,
        shotIso: shotIso ? Number(shotIso) : null,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Shibuya night walk"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Shot date</label>
          <input
            type="date"
            value={shotDate}
            onChange={(e) => setShotDate(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="planned">Planned</option>
            <option value="exposed">Exposed</option>
            <option value="scanned">Scanned</option>
            <option value="complete">Complete</option>
          </select>
        </div>
      </div>

      <PresetField
        label="Camera"
        value={cameraId}
        onChange={setCameraId}
        options={cameras.map((c) => ({
          id: c.id,
          label: c.lens ? `${c.name} · ${c.lens}` : c.name,
        }))}
        onAdd={() => setShowNewCamera(true)}
      />
      {showNewCamera && (
        <InlineCreate
          fields={[
            {
              key: "name",
              label: "Camera name",
              value: newCamera.name,
              onChange: (v) => setNewCamera({ ...newCamera, name: v }),
            },
            {
              key: "lens",
              label: "Lens",
              value: newCamera.lens,
              onChange: (v) => setNewCamera({ ...newCamera, lens: v }),
            },
          ]}
          onCreate={createCamera}
          onCancel={() => setShowNewCamera(false)}
        />
      )}

      <PresetField
        label="Film stock"
        value={filmStockId}
        onChange={selectFilmStock}
        options={films.map((f) => ({
          id: f.id,
          label: `${f.brand} ${f.name}${f.iso ? ` · ISO ${f.iso}` : ""}`,
        }))}
        onAdd={() => setShowNewFilm(true)}
      />
      {filmStockId && (
        <div>
          <label className="mb-1 block text-sm font-medium">Shot at ISO</label>
          <input
            type="number"
            min={1}
            value={shotIso}
            onChange={(e) => setShotIso(e.target.value)}
            placeholder={
              films.find((f) => f.id === filmStockId)?.iso != null
                ? String(films.find((f) => f.id === filmStockId)!.iso)
                : "e.g. 400"
            }
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Defaults to the film&apos;s box speed. Change for push/pull (e.g.
            Portra 400 shot at 200).
          </p>
        </div>
      )}
      {showNewFilm && (
        <InlineCreate
          fields={[
            {
              key: "brand",
              label: "Brand",
              value: newFilm.brand,
              onChange: (v) => setNewFilm({ ...newFilm, brand: v }),
            },
            {
              key: "name",
              label: "Name",
              value: newFilm.name,
              onChange: (v) => setNewFilm({ ...newFilm, name: v }),
            },
            {
              key: "iso",
              label: "ISO",
              value: newFilm.iso,
              onChange: (v) => setNewFilm({ ...newFilm, iso: v }),
            },
          ]}
          onCreate={createFilm}
          onCancel={() => setShowNewFilm(false)}
        />
      )}

      <PresetField
        label="Location"
        value={locationId}
        onChange={setLocationId}
        options={locations.map((l) => ({ id: l.id, label: l.name }))}
        onAdd={() => setShowNewLocation(true)}
      />
      {showNewLocation && (
        <InlineCreate
          fields={[
            {
              key: "name",
              label: "Location name",
              value: newLocation.name,
              onChange: (v) => setNewLocation({ ...newLocation, name: v }),
            },
          ]}
          onCreate={createLocation}
          onCancel={() => setShowNewLocation(false)}
        />
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Pushed +1, expired 2019..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

function PresetField({
  label,
  value,
  onChange,
  options,
  onAdd,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  onAdd: () => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs text-zinc-500 hover:text-zinc-900"
        >
          + Add new
        </button>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
      >
        <option value="">— Select —</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function InlineCreate({
  fields,
  onCreate,
  onCancel,
}: {
  fields: Array<{
    key: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
  }>;
  onCreate: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3 space-y-2">
      {fields.map((f) => (
        <input
          key={f.key}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
          placeholder={f.label}
          className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
        />
      ))}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCreate}
          className="rounded-md bg-zinc-800 px-3 py-1 text-xs text-white"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1 text-xs text-zinc-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
