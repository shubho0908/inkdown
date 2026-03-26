export interface Folder {
  id: string
  user_id: string
  name: string
  parent_id: string | null
  slug: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface File {
  id: string
  user_id: string
  folder_id: string | null
  name: string
  content: string
  slug: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface TreeItem {
  id: string
  name: string
  type: 'file' | 'folder'
  parent_id: string | null
  children?: TreeItem[]
  is_public?: boolean
  slug?: string | null
}
