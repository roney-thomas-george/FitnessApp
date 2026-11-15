import { FoodLog, FoodItem } from '../types';

export interface ProgressPhotoMeta {
  id: string;
  name: string;
  date: string;
  weightKg?: number;
  thumbnailLink?: string;
  webContentLink?: string;
}

const FOLDER_NAME = 'PulseFit Personal Fitness & Nutrition';
const MEAL_FILE_NAME = 'PulseFit_Detailed_Meal_Logs.json';

/**
 * Searches for or creates the dedicated PulseFit folder on the user's personal Google Drive
 */
export async function getOrCreateDriveFolder(accessToken: string): Promise<string> {
  // Check if folder exists
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`);
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!searchRes.ok) {
    throw new Error(`Failed to query Google Drive: ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create Google Drive folder: ${createRes.statusText}`);
  }

  const created = await createRes.json();
  return created.id;
}

/**
 * Saves or appends detailed meal logs to the client's Google Drive JSON file
 */
export async function saveDetailedMealLogsToDrive(
  accessToken: string,
  newLog: FoodLog
): Promise<{ fileId: string; totalLogsCount: number }> {
  const folderId = await getOrCreateDriveFolder(accessToken);

  // Check if PulseFit_Detailed_Meal_Logs.json exists
  const query = encodeURIComponent(`name='${MEAL_FILE_NAME}' and '${folderId}' in parents and trashed=false`);
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const searchData = await searchRes.json();
  let existingLogs: FoodLog[] = [];
  let existingFileId: string | null = null;

  if (searchData.files && searchData.files.length > 0) {
    existingFileId = searchData.files[0].id;
    // Download current contents
    try {
      const getRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${existingFileId}?alt=media`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (getRes.ok) {
        existingLogs = await getRes.json();
      }
    } catch {
      existingLogs = [];
    }
  }

  // Prepend new log
  const updatedLogs = [newLog, ...existingLogs.filter((l) => l.id !== newLog.id)];
  const fileContent = JSON.stringify(updatedLogs, null, 2);

  if (existingFileId) {
    // Update file content via upload
    const updateRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
      }
    );
    if (!updateRes.ok) {
      throw new Error(`Failed to update Drive meal logs: ${updateRes.statusText}`);
    }
    return { fileId: existingFileId, totalLogsCount: updatedLogs.length };
  } else {
    // Create new file inside folder (multipart upload)
    const boundary = '-------PulseFitBoundary' + Math.random().toString(36).substring(2);
    const metadata = {
      name: MEAL_FILE_NAME,
      parents: [folderId],
      mimeType: 'application/json',
    };

    const multipartRequestBody =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      `\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      fileContent +
      `\r\n` +
      `--${boundary}--`;

    const createRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!createRes.ok) {
      throw new Error(`Failed to create Drive meal logs: ${createRes.statusText}`);
    }

    const file = await createRes.json();
    return { fileId: file.id, totalLogsCount: updatedLogs.length };
  }
}

/**
 * Loads detailed meal logs from the client's Google Drive
 */
export async function loadDetailedMealLogsFromDrive(accessToken: string): Promise<FoodLog[]> {
  try {
    const folderId = await getOrCreateDriveFolder(accessToken);
    const query = encodeURIComponent(`name='${MEAL_FILE_NAME}' and '${folderId}' in parents and trashed=false`);
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const searchData = await searchRes.json();
    if (!searchData.files || searchData.files.length === 0) {
      return [];
    }

    const fileId = searchData.files[0].id;
    const fileRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!fileRes.ok) return [];
    return await fileRes.json();
  } catch (err) {
    console.warn('Error reading Drive meal logs:', err);
    return [];
  }
}

/**
 * Uploads a client body progress photo directly to Google Drive
 */
export async function uploadProgressPhotoToDrive(
  accessToken: string,
  imageBlob: Blob,
  fileName: string,
  weightKg?: number
): Promise<ProgressPhotoMeta> {
  const folderId = await getOrCreateDriveFolder(accessToken);

  // Create metadata
  const metadata = {
    name: fileName,
    parents: [folderId],
    description: weightKg ? `Body Weight Progress Photo: ${weightKg} kg` : 'Body Progress Photo',
  };

  const boundary = '-------PulseFitPhoto' + Math.random().toString(36).substring(2);
  const metadataPart =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(metadata) +
    `\r\n`;

  const closing = `\r\n--${boundary}--`;

  // Combine parts into an ArrayBuffer / Blob
  const combinedBlob = new Blob(
    [metadataPart, `--${boundary}\r\nContent-Type: ${imageBlob.type || 'image/jpeg'}\r\n\r\n`, imageBlob, closing],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,thumbnailLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: combinedBlob,
    }
  );

  if (!res.ok) {
    throw new Error(`Drive photo upload failed: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    date: new Date().toISOString().split('T')[0],
    weightKg,
    thumbnailLink: data.thumbnailLink,
    webContentLink: data.webContentLink,
  };
}

/**
 * Lists progress photos stored in the PulseFit Drive folder
 */
export async function listProgressPhotosFromDrive(accessToken: string): Promise<ProgressPhotoMeta[]> {
  try {
    const folderId = await getOrCreateDriveFolder(accessToken);
    const query = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed=false`);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,description,thumbnailLink,webContentLink,createdTime)&orderBy=createdTime desc`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return (data.files || []).map((f: { id: string; name: string; description?: string; thumbnailLink?: string; webContentLink?: string; createdTime?: string }) => {
      let weight: number | undefined;
      if (f.description && f.description.includes('kg')) {
        const m = f.description.match(/(\d+(\.\d+)?)\s*kg/);
        if (m) weight = parseFloat(m[1]);
      }
      return {
        id: f.id,
        name: f.name,
        date: f.createdTime ? f.createdTime.split('T')[0] : new Date().toISOString().split('T')[0],
        weightKg: weight,
        thumbnailLink: f.thumbnailLink,
        webContentLink: f.webContentLink,
      };
    });
  } catch (err) {
    console.warn('Error reading Drive photos:', err);
    return [];
  }
}
