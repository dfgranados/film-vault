"use client";

import { useEffect, useState } from "react";
import {
  defaultFilters,
  FilterSidebar,
  type PhotoFilters,
} from "@/components/FilterSidebar";
import { PhotoGrid } from "@/components/PhotoGrid";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import type { Photo } from "@/types";

export default function BrowsePage() {
  const [filters, setFilters] = useState<PhotoFilters>(defaultFilters);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  function handleFilterChange(next: PhotoFilters) {
    setLoading(true);
    setFilters(next);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const params = new URLSearchParams();
      if (filters.rollId) params.set("rollId", filters.rollId);
      if (filters.cameraId) params.set("cameraId", filters.cameraId);
      if (filters.filmStockId) params.set("filmStockId", filters.filmStockId);
      if (filters.locationId) params.set("locationId", filters.locationId);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.favorites) params.set("favorites", "true");
      if (filters.minRating) params.set("minRating", filters.minRating);

      const res = await fetch(`/api/photos?${params}`);
      if (cancelled) return;
      setPhotos(await res.json());
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  async function reloadPhotos() {
    const params = new URLSearchParams();
    if (filters.rollId) params.set("rollId", filters.rollId);
    if (filters.cameraId) params.set("cameraId", filters.cameraId);
    if (filters.filmStockId) params.set("filmStockId", filters.filmStockId);
    if (filters.locationId) params.set("locationId", filters.locationId);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.favorites) params.set("favorites", "true");
    if (filters.minRating) params.set("minRating", filters.minRating);

    const res = await fetch(`/api/photos?${params}`);
    setPhotos(await res.json());
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Browse</h1>
      <div className="flex flex-col gap-6 lg:flex-row">
        <FilterSidebar filters={filters} onChange={handleFilterChange} />
        <div className="flex-1">
          {loading ? (
            <p className="text-zinc-500">Loading...</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-zinc-500">
                {photos.length} photo{photos.length !== 1 ? "s" : ""}
              </p>
              <PhotoGrid photos={photos} onSelect={setSelectedPhoto} />
            </>
          )}
        </div>
      </div>

      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onUpdate={reloadPhotos}
        />
      )}
    </div>
  );
}
