export interface Camera {
  id: string;
  name: string;
  lens: string | null;
  notes: string | null;
}

export interface FilmStock {
  id: string;
  brand: string;
  name: string;
  iso: number | null;
  type: string | null;
  notes: string | null;
}

export interface Location {
  id: string;
  name: string;
  parentId: string | null;
}

export interface Roll {
  id: string;
  slug: string;
  title: string;
  status: string;
  shotDate: string | null;
  notes: string | null;
  cameraId: string | null;
  filmStockId: string | null;
  locationId: string | null;
  shotIso: number | null;
  createdAt: string;
  updatedAt: string;
  camera?: Camera | null;
  filmStock?: FilmStock | null;
  location?: Location | null;
  locationDisplay?: string;
  photoCount?: number;
}

export interface PhotoVariant {
  id: string;
  photoId: string;
  kind: string;
  filePath: string;
  checksum: string;
  width: number | null;
  height: number | null;
  isPrimary: boolean;
}

export interface Photo {
  id: string;
  rollId: string;
  frameNumber: number;
  caption: string | null;
  isFavorite: boolean;
  rating: number | null;
  variants?: PhotoVariant[];
  primaryVariant?: PhotoVariant | null;
  roll?: Roll;
  camera?: Camera | null;
  filmStock?: FilmStock | null;
  location?: Location | null;
}

export interface PostSetItem {
  id: string;
  postSetId: string;
  photoId: string;
  sortOrder: number;
  cropNotes: string | null;
  photo?: Photo;
  platformPosts?: PlatformPost[];
}

export interface PlatformPost {
  id: string;
  postSetItemId: string;
  platform: string;
  postedAt: string | null;
  url: string | null;
  notes: string | null;
}

export interface PostSet {
  id: string;
  name: string;
  targetPlatform: string | null;
  notes: string | null;
  items?: PostSetItem[];
}
