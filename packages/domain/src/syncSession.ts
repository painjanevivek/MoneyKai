export type RemoteSyncSession = Readonly<{
  userId: string;
  generation: number;
}>;

let remoteSyncGeneration = 0;

export const captureRemoteSyncSession = (userId: string): RemoteSyncSession => ({
  userId,
  generation: remoteSyncGeneration,
});

export const invalidateRemoteSyncSession = () => {
  remoteSyncGeneration += 1;
};

export const isRemoteSyncSessionCurrent = (
  session: RemoteSyncSession,
  currentUserId: string | null | undefined,
) => session.generation === remoteSyncGeneration && session.userId === currentUserId;
