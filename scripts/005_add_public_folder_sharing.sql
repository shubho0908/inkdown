BEGIN;

ALTER TABLE public.folders
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.files
  ALTER COLUMN slug DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'folders_slug_key'
      AND conrelid = 'public.folders'::regclass
  ) THEN
    ALTER TABLE public.folders
      ADD CONSTRAINT folders_slug_key UNIQUE (slug);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_folders_slug ON public.folders(slug);
CREATE INDEX IF NOT EXISTS idx_folders_is_public ON public.folders(is_public);

DROP POLICY IF EXISTS "Anyone can view public folders" ON public.folders;
CREATE POLICY "Anyone can view public folders" ON public.folders
  FOR SELECT USING (is_public = TRUE);

CREATE OR REPLACE FUNCTION public.get_public_folder_subtree_folders(folder_slug TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  parent_id UUID,
  slug TEXT,
  is_public BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE root_folder AS (
    SELECT
      folders.id,
      folders.user_id,
      folders.name,
      folders.parent_id,
      folders.slug,
      folders.is_public,
      folders.created_at,
      folders.updated_at
    FROM public.folders
    WHERE folders.slug = folder_slug
      AND folders.is_public = TRUE
    LIMIT 1
  ),
  subtree AS (
    SELECT * FROM root_folder
    UNION ALL
    SELECT
      child.id,
      child.user_id,
      child.name,
      child.parent_id,
      child.slug,
      child.is_public,
      child.created_at,
      child.updated_at
    FROM public.folders AS child
    INNER JOIN subtree AS parent
      ON child.parent_id = parent.id
  )
  SELECT *
  FROM subtree
  ORDER BY parent_id NULLS FIRST, name;
$$;

CREATE OR REPLACE FUNCTION public.get_public_folder_subtree_files(folder_slug TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  folder_id UUID,
  name TEXT,
  slug TEXT,
  is_public BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE root_folder AS (
    SELECT folders.id
    FROM public.folders
    WHERE folders.slug = folder_slug
      AND folders.is_public = TRUE
    LIMIT 1
  ),
  subtree AS (
    SELECT id FROM root_folder
    UNION ALL
    SELECT child.id
    FROM public.folders AS child
    INNER JOIN subtree AS parent
      ON child.parent_id = parent.id
  )
  SELECT
    files.id,
    files.user_id,
    files.folder_id,
    files.name,
    files.slug,
    files.is_public,
    files.created_at,
    files.updated_at
  FROM public.files
  INNER JOIN subtree
    ON files.folder_id = subtree.id
  ORDER BY files.name;
$$;

CREATE OR REPLACE FUNCTION public.get_public_folder_file(
  folder_slug TEXT,
  target_file_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  folder_id UUID,
  name TEXT,
  content TEXT,
  slug TEXT,
  is_public BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE root_folder AS (
    SELECT folders.id
    FROM public.folders
    WHERE folders.slug = folder_slug
      AND folders.is_public = TRUE
    LIMIT 1
  ),
  subtree AS (
    SELECT id FROM root_folder
    UNION ALL
    SELECT child.id
    FROM public.folders AS child
    INNER JOIN subtree AS parent
      ON child.parent_id = parent.id
  )
  SELECT
    files.id,
    files.user_id,
    files.folder_id,
    files.name,
    files.content,
    files.slug,
    files.is_public,
    files.created_at,
    files.updated_at
  FROM public.files
  INNER JOIN subtree
    ON files.folder_id = subtree.id
  WHERE files.id = target_file_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_folder_subtree_folders(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_folder_subtree_files(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_folder_file(TEXT, UUID) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_folder_subtree_folders(TEXT) FROM public;
REVOKE EXECUTE ON FUNCTION public.get_public_folder_subtree_files(TEXT) FROM public;
REVOKE EXECUTE ON FUNCTION public.get_public_folder_file(TEXT, UUID) FROM public;

COMMIT;
