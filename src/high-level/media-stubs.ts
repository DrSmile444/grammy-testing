import type { Animation, Audio, Document, PhotoSize, Sticker, Video, VideoNote, Voice } from 'grammy/types';

/**
 * Returns a minimal PhotoSize stub suitable for synthetic incoming photo updates.
 * Bots that read `message.photo[0].file_id` will receive the supplied `fileId`.
 * @param fileId - The `file_id` to embed in the stub.
 * @returns A minimal `PhotoSize` object.
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
 * @param fileId - The `file_id` to embed in the stub.
 * @returns A minimal `Document` object.
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
 * @param fileId - The `file_id` to embed in the stub.
 * @returns A minimal `Video` object.
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

/**
 * Returns a minimal Audio stub suitable for synthetic incoming audio updates.
 * @param fileId - The `file_id` to embed in the stub.
 * @returns A minimal `Audio` object.
 */
export function makeAudioStub(fileId: string): Audio {
  return {
    file_id: fileId,
    file_unique_id: `${fileId}_unique`,
    duration: 0,
    mime_type: 'audio/mpeg',
  };
}

/**
 * Returns a minimal Voice stub suitable for synthetic incoming voice updates.
 * @param fileId - The `file_id` to embed in the stub.
 * @returns A minimal `Voice` object.
 */
export function makeVoiceStub(fileId: string): Voice {
  return {
    file_id: fileId,
    file_unique_id: `${fileId}_unique`,
    duration: 0,
    mime_type: 'audio/ogg',
  };
}

/**
 * Returns a minimal VideoNote stub suitable for synthetic incoming video note updates.
 * @param fileId - The `file_id` to embed in the stub.
 * @returns A minimal `VideoNote` object.
 */
export function makeVideoNoteStub(fileId: string): VideoNote {
  return {
    file_id: fileId,
    file_unique_id: `${fileId}_unique`,
    length: 240,
    duration: 0,
  };
}

/**
 * Returns a minimal Animation stub suitable for synthetic incoming animation (GIF) updates.
 * @param fileId - The `file_id` to embed in the stub.
 * @returns A minimal `Animation` object.
 */
export function makeAnimationStub(fileId: string): Animation {
  return {
    file_id: fileId,
    file_unique_id: `${fileId}_unique`,
    width: 320,
    height: 240,
    duration: 0,
  };
}

/**
 * Returns a minimal Sticker stub suitable for synthetic incoming sticker updates.
 * @param fileId - The `file_id` to embed in the stub.
 * @returns A minimal `Sticker` object.
 */
export function makeStickerStub(fileId: string): Sticker {
  return {
    file_id: fileId,
    file_unique_id: `${fileId}_unique`,
    width: 512,
    height: 512,
    is_animated: false,
    is_video: false,
    type: 'regular',
  };
}
