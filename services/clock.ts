export const getSyncedNow = (offsetMs: number = 0): Date => {
  return new Date(Date.now() + offsetMs);
};

export const getServerClockOffsetMs = async (url: string = window.location.href): Promise<number | null> => {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store',
    });
    const serverDateHeader = response.headers.get('date');
    if (!serverDateHeader) return null;

    const serverMs = Date.parse(serverDateHeader);
    if (Number.isNaN(serverMs)) return null;

    return serverMs - Date.now();
  } catch (error) {
    console.warn('Clock sync failed, falling back to device time.', error);
    return null;
  }
};
