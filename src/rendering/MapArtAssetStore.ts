export interface MapArtImageRecord {
  image: HTMLImageElement;
  loaded: boolean;
  failed: boolean;
  ready: Promise<boolean>;
}

const records = new Map<string, MapArtImageRecord>();

/**
 * One decoded image per URL, shared by the campaign preview and board renderer.
 * Sharing the record avoids a second decode when a player starts the selected map.
 */
export function mapArtImage(source: string): MapArtImageRecord {
  const cached = records.get(source);
  if (cached) return cached;

  const image = new Image();
  image.decoding = 'async';
  let settle: (loaded: boolean) => void = () => undefined;
  const record: MapArtImageRecord = {
    image,
    loaded: false,
    failed: false,
    ready: new Promise<boolean>((resolve) => { settle = resolve; }),
  };

  image.addEventListener('load', () => {
    const finish = (): void => {
      record.loaded = image.naturalWidth > 0 && image.naturalHeight > 0;
      record.failed = !record.loaded;
      settle(record.loaded);
    };
    if (typeof image.decode === 'function') void image.decode().catch(() => undefined).then(finish);
    else finish();
  }, { once: true });
  image.addEventListener('error', () => {
    record.failed = true;
    settle(false);
  }, { once: true });
  image.src = source;
  records.set(source, record);
  return record;
}
