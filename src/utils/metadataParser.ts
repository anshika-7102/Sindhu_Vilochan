import { SurveyMetadata, DEFAULT_MUMBAI_SURVEY } from '@/types';

export function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCSVMetadata(content: string): Partial<SurveyMetadata> {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return {};

  const result: Partial<SurveyMetadata> = {};
  const firstRow = parseCSVRow(lines[0]);

  // Check if it's Key-Value format (e.g. "parameter,value" or "key,value" or row count > 1 with 2 columns)
  const isKeyValue =
    firstRow.length === 2 &&
    (firstRow[0].toLowerCase().includes('param') ||
      firstRow[0].toLowerCase().includes('key') ||
      firstRow[0].toLowerCase().includes('field') ||
      lines.length >= 3);

  if (isKeyValue) {
    // Key-value parsing
    for (const line of lines) {
      const cols = parseCSVRow(line);
      if (cols.length < 2) continue;
      const key = cols[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const val = cols[1].replace(/^["']|["']$/g, '').trim();

      if (key.includes('surveyid') || key === 'id' || key.includes('missionid')) {
        result.surveyId = val;
      } else if (key.includes('corridor') || key.includes('transect') || key.includes('track')) {
        result.corridor = val;
      } else if (key.includes('frame') || key.includes('images') || key.includes('count')) {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed)) result.frames = parsed;
      } else if (key.includes('swath') || key.includes('range') || key.includes('width')) {
        result.swath = val.includes('m') ? val : `${val} m`;
      } else if (key.includes('sensor') || key.includes('sonar') || key.includes('device')) {
        result.sensor = val;
      } else if (key.includes('origin') || key.includes('coord') || key.includes('gps') || key.includes('location')) {
        result.origin = val;
      }
    }
  } else {
    // Column header format
    const headers = firstRow.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    if (lines.length > 1) {
      const values = parseCSVRow(lines[1]);
      let lat = '';
      let lon = '';

      headers.forEach((header, idx) => {
        const val = values[idx]?.replace(/^["']|["']$/g, '').trim();
        if (!val) return;

        if (header.includes('surveyid') || header === 'id' || header.includes('missionid')) {
          result.surveyId = val;
        } else if (header.includes('corridor') || header.includes('transect')) {
          result.corridor = val;
        } else if (header.includes('frame') || header.includes('count')) {
          const parsed = parseInt(val, 10);
          if (!isNaN(parsed)) result.frames = parsed;
        } else if (header.includes('swath') || header.includes('range')) {
          result.swath = val.includes('m') ? val : `${val} m`;
        } else if (header.includes('sensor') || header.includes('sonar')) {
          result.sensor = val;
        } else if (header.includes('origin') || header.includes('coord') || header.includes('gps')) {
          result.origin = val;
        } else if (header.includes('lat')) {
          lat = val;
        } else if (header.includes('lon')) {
          lon = val;
        }
      });

      if (!result.origin && lat && lon) {
        result.origin = `${lat}°N, ${lon}°E`;
      }
    }
  }

  return result;
}

/**
 * Parses tabular CSV containing multiple rows, each row associated with an image name.
 * Extracts per-image metadata map keyed by image name / base name, plus survey-level summary.
 */
export function parseTabularCSV(content: string): {
  perImageMap: Map<string, Record<string, string>>;
  surveySummary: Partial<SurveyMetadata>;
} {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const perImageMap = new Map<string, Record<string, string>>();
  const surveySummary: Partial<SurveyMetadata> = {};

  if (lines.length === 0) return { perImageMap, surveySummary };

  const firstRow = parseCSVRow(lines[0]);
  const isKeyValue =
    firstRow.length === 2 &&
    (firstRow[0].toLowerCase().includes('param') ||
      firstRow[0].toLowerCase().includes('key') ||
      firstRow[0].toLowerCase().includes('field'));

  if (isKeyValue) {
    return { perImageMap, surveySummary: parseCSVMetadata(content) };
  }

  const rawHeaders = firstRow;
  const cleanHeaders = rawHeaders.map((h) => h.trim());
  const lowerHeaders = cleanHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));

  // Find image identifier column
  const imageColKeywords = [
    'image_name',
    'imagename',
    'image',
    'file_name',
    'filename',
    'file',
    'frame_name',
    'framename',
    'frame',
    'frame_id',
    'frameid',
    'name',
    'photo',
    'sonar_frame',
    'target',
    'track_image',
  ];

  let imageColIdx = lowerHeaders.findIndex((h) =>
    imageColKeywords.some((k) => h === k || h.startsWith(k) || h.endsWith(k))
  );

  // Fallback: check if line 1 has any cell with an image extension
  if (imageColIdx === -1 && lines.length > 1) {
    const sampleRow = parseCSVRow(lines[1]);
    for (let c = 0; c < sampleRow.length; c++) {
      if (/\.(png|jpe?g|tif|tiff|bmp)$/i.test(sampleRow[c])) {
        imageColIdx = c;
        break;
      }
    }
  }

  // Fallback to first column
  if (imageColIdx === -1) {
    imageColIdx = 0;
  }

  // Parse each image row
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVRow(lines[i]);
    if (cols.length === 0 || cols.every((c) => c === '')) continue;

    const rawImgName = cols[imageColIdx]?.trim() || `frame_${i}`;
    const rowDict: Record<string, string> = {};

    cleanHeaders.forEach((header, idx) => {
      if (idx < cols.length && cols[idx] !== undefined) {
        const val = cols[idx].replace(/^["']|["']$/g, '').trim();
        rowDict[header] = val;
      }
    });

    // Extract normalized fields for quick display
    let lat = '';
    let lon = '';
    cleanHeaders.forEach((header, idx) => {
      const hLower = lowerHeaders[idx];
      const val = cols[idx]?.replace(/^["']|["']$/g, '').trim() || '';
      if (!val) return;

      if (hLower === 'lat' || hLower === 'latitude' || hLower.includes('lat_')) {
        lat = val;
      } else if (hLower === 'lon' || hLower === 'longitude' || hLower.includes('lon_')) {
        lon = val;
      } else if (hLower.includes('coord') || hLower.includes('gps') || hLower.includes('origin')) {
        rowDict.coordinates = val;
      } else if (hLower.includes('depth') || hLower === 'depth_m') {
        rowDict.depth = val.includes('m') ? val : `${val} m`;
      } else if (hLower.includes('swath') || hLower.includes('range')) {
        rowDict.swath = val.includes('m') ? val : `${val} m`;
      } else if (hLower.includes('sensor') || hLower.includes('sonar')) {
        rowDict.sensor = val;
      } else if (hLower.includes('alt') || hLower.includes('altitude')) {
        rowDict.altitude = val.includes('m') ? val : `${val} m`;
      } else if (hLower.includes('speed')) {
        rowDict.speed = val.includes('kn') ? val : `${val} kn`;
      } else if (hLower.includes('head') || hLower.includes('course')) {
        rowDict.heading = val.includes('°') ? val : `${val}°`;
      } else if (hLower.includes('time') || hLower.includes('date')) {
        rowDict.timestamp = val;
      } else if (hLower.includes('vessel')) {
        rowDict.vessel = val;
      } else if (hLower.includes('channel') || hLower.includes('side')) {
        rowDict.channel = val;
      }
    });

    if (!rowDict.coordinates && lat && lon) {
      const latFormatted = lat.includes('°') ? lat : `${parseFloat(lat).toFixed(4)}°N`;
      const lonFormatted = lon.includes('°') ? lon : `${parseFloat(lon).toFixed(4)}°E`;
      rowDict.coordinates = `${latFormatted}, ${lonFormatted}`;
    }

    // Index under various normalizations
    const cleanImgName = rawImgName.replace(/^["']|["']$/g, '').trim();
    const lowerName = cleanImgName.toLowerCase();
    const baseName = lowerName.replace(/\.[^/.]+$/, '');
    const filenameOnly = lowerName.split(/[/\\]/).pop() || lowerName;
    const baseFilenameOnly = filenameOnly.replace(/\.[^/.]+$/, '');

    perImageMap.set(lowerName, rowDict);
    perImageMap.set(baseName, rowDict);
    perImageMap.set(filenameOnly, rowDict);
    perImageMap.set(baseFilenameOnly, rowDict);
    perImageMap.set(cleanImgName, rowDict);
    perImageMap.set(String(i), rowDict);
    perImageMap.set(`f${String(i).padStart(2, '0')}`, rowDict);
    perImageMap.set(`frame_${String(i).padStart(2, '0')}`, rowDict);

    // If survey summary not populated yet, use first row
    if (i === 1) {
      if (rowDict.coordinates) surveySummary.origin = rowDict.coordinates;
      if (rowDict.swath) surveySummary.swath = rowDict.swath;
      if (rowDict.sensor) surveySummary.sensor = rowDict.sensor;
      if (rowDict.vessel) surveySummary.vessel = rowDict.vessel;
      if (rowDict.survey_id || rowDict.SurveyID || rowDict.surveyId) {
        surveySummary.surveyId = rowDict.survey_id || rowDict.SurveyID || rowDict.surveyId;
      }
      if (rowDict.corridor || rowDict.Corridor) {
        surveySummary.corridor = rowDict.corridor || rowDict.Corridor;
      }
    }
  }

  surveySummary.frames = lines.length - 1;

  return { perImageMap, surveySummary };
}

/**
 * Matches an image file name against the parsed metadata map
 */
export function getMetadataForImage(
  fileName: string,
  frameNumber: number,
  perImageMap: Map<string, Record<string, string>>
): Record<string, string> | undefined {
  if (perImageMap.size === 0) return undefined;

  const clean = fileName.trim();
  const lower = clean.toLowerCase();
  const base = lower.replace(/\.[^/.]+$/, '');
  const fileOnly = lower.split(/[/\\]/).pop() || lower;
  const baseFileOnly = fileOnly.replace(/\.[^/.]+$/, '');

  if (perImageMap.has(lower)) return perImageMap.get(lower);
  if (perImageMap.has(fileOnly)) return perImageMap.get(fileOnly);
  if (perImageMap.has(base)) return perImageMap.get(base);
  if (perImageMap.has(baseFileOnly)) return perImageMap.get(baseFileOnly);

  // Match by frame number
  const fNum = String(frameNumber);
  const fPadded = `f${String(frameNumber).padStart(2, '0')}`;
  const fFramePadded = `frame_${String(frameNumber).padStart(2, '0')}`;
  if (perImageMap.has(fNum)) return perImageMap.get(fNum);
  if (perImageMap.has(fPadded)) return perImageMap.get(fPadded);
  if (perImageMap.has(fFramePadded)) return perImageMap.get(fFramePadded);

  // Partial match: check if filename contains any key or vice versa
  for (const [key, value] of perImageMap.entries()) {
    if (key.length >= 3 && (lower.includes(key) || key.includes(baseFileOnly))) {
      return value;
    }
  }

  return undefined;
}

export function parseJSONMetadata(content: string): {
  surveySummary: Partial<SurveyMetadata>;
  perImageMap: Map<string, Record<string, string>>;
} {
  const perImageMap = new Map<string, Record<string, string>>();
  const surveySummary: Partial<SurveyMetadata> = {};

  try {
    const raw = JSON.parse(content);

    // If it's an array of image objects
    if (Array.isArray(raw)) {
      raw.forEach((item, idx) => {
        const imgName = item.image_name || item.filename || item.name || item.id || `frame_${idx + 1}`;
        const dict: Record<string, string> = {};
        Object.entries(item).forEach(([k, v]) => {
          dict[k] = String(v);
        });
        perImageMap.set(String(imgName).toLowerCase(), dict);
        perImageMap.set(String(imgName).toLowerCase().replace(/\.[^/.]+$/, ''), dict);
      });
      surveySummary.frames = raw.length;
      return { surveySummary, perImageMap };
    }

    const data = raw.survey || raw.metadata || raw;

    surveySummary.surveyId =
      data.surveyId || data.survey_id || data.id || data.mission_id || data.SurveyID;
    surveySummary.corridor =
      data.corridor || data.corridor_name || data.corridor_id || data.Corridor;
    if (data.frames !== undefined || data.frame_count !== undefined || data.Frames !== undefined) {
      const f = parseInt(data.frames ?? data.frame_count ?? data.Frames, 10);
      if (!isNaN(f)) surveySummary.frames = f;
    }
    if (data.swath || data.swath_width || data.Swath) {
      const sw = String(data.swath || data.swath_width || data.Swath);
      surveySummary.swath = sw.includes('m') ? sw : `${sw} m`;
    }
    surveySummary.sensor =
      data.sensor || data.sensor_type || data.sensor_model || data.sonar_model || data.Sensor;
    surveySummary.origin =
      data.origin ||
      data.coordinates ||
      data.coords ||
      data.origin_coords ||
      data.Origin ||
      (data.latitude && data.longitude ? `${data.latitude}°N, ${data.longitude}°E` : undefined);

    surveySummary.vessel = data.vessel || data.vessel_name || data.ship;
    surveySummary.operator = data.operator || data.survey_operator || data.agency;
    surveySummary.region = data.region || data.area;
    surveySummary.frequency = data.frequency || data.operatingFrequency;
    surveySummary.captureDate = data.captureDate || data.surveyWindow || data.date;

    // Also check if images are nested in JSON
    const imagesList = data.images || raw.images || data.frames_data;
    if (Array.isArray(imagesList)) {
      imagesList.forEach((item, idx) => {
        const imgName = item.image_name || item.filename || item.name || item.id || `frame_${idx + 1}`;
        const dict: Record<string, string> = {};
        Object.entries(item).forEach(([k, v]) => {
          dict[k] = String(v);
        });
        perImageMap.set(String(imgName).toLowerCase(), dict);
        perImageMap.set(String(imgName).toLowerCase().replace(/\.[^/.]+$/, ''), dict);
      });
    }

    return { surveySummary, perImageMap };
  } catch (err) {
    console.error('Failed to parse JSON metadata', err);
    return { surveySummary, perImageMap };
  }
}

export async function parseMetadataFile(file: File): Promise<{
  survey: SurveyMetadata;
  perImageMap: Map<string, Record<string, string>>;
}> {
  const content = await file.text();
  const isJson = file.name.endsWith('.json') || file.type.includes('json');

  const { perImageMap, surveySummary } = isJson
    ? parseJSONMetadata(content)
    : parseTabularCSV(content);

  const survey: SurveyMetadata = {
    surveyId: surveySummary.surveyId || DEFAULT_MUMBAI_SURVEY.surveyId,
    corridor: surveySummary.corridor || DEFAULT_MUMBAI_SURVEY.corridor,
    frames: surveySummary.frames !== undefined ? surveySummary.frames : DEFAULT_MUMBAI_SURVEY.frames,
    swath: surveySummary.swath || DEFAULT_MUMBAI_SURVEY.swath,
    sensor: surveySummary.sensor || DEFAULT_MUMBAI_SURVEY.sensor,
    origin: surveySummary.origin || DEFAULT_MUMBAI_SURVEY.origin,
    vessel: surveySummary.vessel || DEFAULT_MUMBAI_SURVEY.vessel,
    operator: surveySummary.operator || DEFAULT_MUMBAI_SURVEY.operator,
    region: surveySummary.region || DEFAULT_MUMBAI_SURVEY.region,
    frequency: surveySummary.frequency || DEFAULT_MUMBAI_SURVEY.frequency,
    captureDate: surveySummary.captureDate || DEFAULT_MUMBAI_SURVEY.captureDate,
    isDemo: false,
  };

  return { survey, perImageMap };
}
