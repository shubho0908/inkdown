export const workspaceKeys = {
  all: ['workspace'] as const,
  files: () => [...workspaceKeys.all, 'files'] as const,
  file: (id: string) => [...workspaceKeys.files(), id] as const,
  folders: () => [...workspaceKeys.all, 'folders'] as const,
}
