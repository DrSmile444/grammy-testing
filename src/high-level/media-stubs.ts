import type { Document, PhotoSize, Video } from 'grammy/types';

/**
 * Returns a minimal PhotoSize stub suitable for synthetic incoming photo updates.
 * Bots that read `message.photo[0].file_id` will receive the supplied `fileId`.
 * @param fileId
 */
export function makePhotoSizeStub(fileId: string): PhotoSize {
  return {
    file_id: fileId,
    file_unique_id: `${fileId}_unique`,
    width: 800,
    height: 600,
  };
}

/**
 * Returns a minimal Document stub suitable for synthetic incoming document updates.
 * @param fileId
 */
export function makeDocumentStub(fileId: string): Document {
  return {
    file_id: fileId,
    file_unique_id: `${fileId}_unique`,
    file_name: fileId,
  };
}

/**
 * Returns a minimal Video stub suitable for synthetic incoming video updates.
 * @param fileId
 */
export function makeVideoStub(fileId: string): Video {
  return {
    file_id: fileId,
    file_unique_id: `${fileId}_unique`,
    width: 1280,
    height: 720,
    duration: 0,
  };
}
