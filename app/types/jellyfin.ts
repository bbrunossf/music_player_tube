export interface JellyfinConfig {
  url: string;
  apiKey: string;
  userId: string;
}

export interface JellyfinItem {
  Id: string;
  Name: string;
  Type: string;
  ImageTags?: {
    Primary?: string;
  };
  BackdropImageTags?: string[];
  Overview?: string;
  ProductionYear?: number;
  RunTimeTicks?: number;
  CommunityRating?: number;
  SeriesName?: string;
  SeasonName?: string;
  IndexNumber?: number;
  ParentIndexNumber?: number;
}

export interface JellyfinLibrary {
  Id: string;
  Name: string;
  CollectionType?: string;
}

export interface PlaylistItem extends JellyfinItem {
  addedAt: Date;
}
