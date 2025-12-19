
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webContentLink?: string;
}

export interface GalleryState {
  folderId: string;
  files: GoogleDriveFile[];
  loading: boolean;
  error: string | null;
}

export type ViewMode = 'client' | 'admin';
