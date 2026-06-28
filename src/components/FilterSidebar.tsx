"use client";

import { useEffect, useState } from "react";
import type { Camera, FilmStock, Location, Roll } from "@/types";

export interface PhotoFilters {
  rollId: string;
  cameraId: string;
  filmStockId: string;
  locationId: string;
  dateFrom: string;
  dateTo: string;
  favorites: boolean;
  minRating: string;
}

const defaultFilters: PhotoFilters = {
  rollId: "",
  cameraId: "",
  filmStockId: "",
  locationId: "",
  dateFrom: "",
  dateTo: "",
  favorites: false,
  minRating: "",
};

export function FilterSidebar({
  filters,
  onChange,
}: {
  filters: PhotoFilters;
  onChange: (filters: PhotoFilters) => void;
}) {
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [films, setFilms] = useState<FilmStock[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/rolls").then((r) => r.json()),
      fetch("/api/cameras").then((r) => r.json()),
      fetch("/api/film-stocks").then((r) => r.json()),
      fetch("/api/locations").then((r) => r.json()),
    ]).then(([r, c, f, l]) => {
      setRolls(r);
      setCameras(c);
      setFilms(f);
      setLocations(l);
    });
  }, []);

  function update(key: keyof PhotoFilters, value: string | boolean) {
    onChange({ ...filters, [key]: value });
  }

  function clearAll() {
    onChange(defaultFilters);
  }

  return (
    <aside className="w-full shrink-0 space-y-4 rounded-lg border border-zinc-200 bg-white p-4 lg:w-64">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-zinc-500 hover:text-zinc-900"
        >
          Clear
        </button>
      </div>

      <FilterSelect
        label="Roll"
        value={filters.rollId}
        onChange={(v) => update("rollId", v)}
        options={rolls.map((r) => ({ id: r.id, label: r.title }))}
      />
      <FilterSelect
        label="Camera"
        value={filters.cameraId}
        onChange={(v) => update("cameraId", v)}
        options={cameras.map((c) => ({ id: c.id, label: c.name }))}
      />
      <FilterSelect
        label="Film"
        value={filters.filmStockId}
        onChange={(v) => update("filmStockId", v)}
        options={films.map((f) => ({
          id: f.id,
          label: `${f.brand} ${f.name}`,
        }))}
      />
      <FilterSelect
        label="Location"
        value={filters.locationId}
        onChange={(v) => update("locationId", v)}
        options={locations.map((l) => ({ id: l.id, label: l.name }))}
      />

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          Date range
        </label>
        <div className="space-y-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update("dateFrom", e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update("dateTo", e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.favorites}
          onChange={(e) => update("favorites", e.target.checked)}
        />
        Favorites only
      </label>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          Min rating
        </label>
        <select
          value={filters.minRating}
          onChange={(e) => update("minRating", e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
        >
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={String(n)}>
              {n}+ stars
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-600">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export { defaultFilters };
