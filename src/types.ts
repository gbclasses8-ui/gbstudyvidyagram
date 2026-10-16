export interface Batch {
  id: number;
  title: string;
  thumbnail: string;
  category: string;
}

export interface FolderItem {
  id: string;
  parent_id: string;
  Title: string;
  description?: string;
  material_type: 'FOLDER' | 'VIDEO' | 'PDF' | 'NOTES' | string;
  thumbnail?: string;
  file_link?: string;
  pdf_link?: string;
  download_link?: string;
  duration?: string;
  duration_in_secs?: string | number;
  event_date?: string;
  date_and_time?: string;
  videos_count?: string | number;
  files_count?: string | number;
  tests_count?: string | number;
  course_id?: string | number;
  live_status?: number | string;
  livestream_links?: any[];
}

export interface VideoQuality {
  quality: string;
  url: string;
}

export interface VideoDetails {
  success: boolean;
  video_id: string;
  course_id: string;
  title: string;
  thumbnail?: string;
  decoded_video_link?: string;
  decoded_pdf_link?: string;
  player_url?: string;
  qualities?: VideoQuality[];
  message?: string;
}

export interface BreadcrumbItem {
  id: string;
  title: string;
}
