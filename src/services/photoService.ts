import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/*
 * Fotografia de profil: o alegi din galerie sau faci una cu camera, o decupezi pătrat,
 * apoi o micșorăm la 400px și o comprimăm, ca să încapă ca data URI în documentul users/{uid}.
 */

export type PhotoSource = 'camera' | 'library';

/** Latura pozei salvate, în pixeli. */
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
      source === 'camera' ? 'Ai nevoie de acces la cameră.' : 'Ai nevoie de acces la galerie.',
    );
  }

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 };
  const result =
    source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;

  const image = await ImageManipulator.manipulate(asset.uri).resize({ width: PHOTO_SIZE, height: null }).renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  return saved.base64 ? `data:image/jpeg;base64,${saved.base64}` : null;
}

/** Lățimea maximă a unei poze-amintire, în pixeli. */
const MEMORY_PHOTO_WIDTH = 1080;

/**
 * Alege o poză pentru o amintire (cameră sau galerie), fără decupare.
 * O micșorăm și o comprimăm; întoarce calea fișierului de pe dispozitiv, sau null dacă ai renunțat.
 */
export async function pickMemoryPhoto(source: PhotoSource): Promise<string | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new PhotoPermissionError(
      source === 'camera' ? 'Ai nevoie de acces la cameră.' : 'Ai nevoie de acces la galerie.',
    );
  }

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  const result =
    source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;

  // Nu mărim pozele deja mici.
  const width = Math.min(asset.width || MEMORY_PHOTO_WIDTH, MEMORY_PHOTO_WIDTH);
  const image = await ImageManipulator.manipulate(asset.uri).resize({ width, height: null }).renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.75 });
  return saved.uri;
}
