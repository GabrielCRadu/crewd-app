import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { tr } from '../i18n';

/*
 * Fotografia de profil: o alegi din galerie sau faci una cu camera, o decupezi pătrat,
 * apoi o micșorăm la 400px și o comprimăm, ca să încapă ca data URI în documentul users/{uid}
 * (câteva zeci de KB; fără Firebase Storage, documentul trebuie să rămână mic).
 */

export type PhotoSource = 'camera' | 'library';

/** Latura maximă a pozei salvate, în pixeli. */
const PHOTO_SIZE = 400;

export class PhotoPermissionError extends Error {}

/** Deschide camera sau galeria. Întoarce data URI-ul pozei, sau null dacă ai renunțat. */
export async function pickProfilePhoto(source: PhotoSource): Promise<string | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new PhotoPermissionError(
      source === 'camera' ? tr('Ai nevoie de acces la cameră.') : tr('Ai nevoie de acces la galerie.'),
    );
  }

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 };
  const result =
    source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;

  // Nu mărim pozele deja mici.
  const side = Math.min(asset.width || PHOTO_SIZE, PHOTO_SIZE);
  const image = await ImageManipulator.manipulate(asset.uri).resize({ width: side, height: null }).renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  return saved.base64 ? `data:image/jpeg;base64,${saved.base64}` : null;
}

/** Latura miniaturii din chat și din lista de membri, în pixeli. */
export const THUMB_SIZE = 96;

/**
 * Miniatura pătrată (~96px) a unei poze de profil (data URI sau fișier), ca data URI JPEG de câțiva KB.
 * Întoarce null dacă nu s-a putut genera (poza de profil rămâne oricum salvată).
 */
export async function makeThumbnail(photoUri: string): Promise<string | null> {
  try {
    const image = await ImageManipulator.manipulate(photoUri).resize({ width: THUMB_SIZE, height: THUMB_SIZE }).renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });
    return saved.base64 ? `data:image/jpeg;base64,${saved.base64}` : null;
  } catch (e) {
    console.warn('Nu am putut genera miniatura pozei:', e);
    return null;
  }
}
