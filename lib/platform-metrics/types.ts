export interface PlatformMetrics {
  total_users: number;
  total_documents: number;
  total_folders: number;
  public_documents: number;
  is_ready: boolean;
  computed_at: string;
}

export const UNINITIALIZED_PLATFORM_METRICS: PlatformMetrics = {
  total_users: 0,
  total_documents: 0,
  total_folders: 0,
  public_documents: 0,
  is_ready: false,
  computed_at: new Date(0).toISOString(),
};
