/** Umbră fină pentru carduri. iOS folosește shadow*, Android folosește elevation. */
export const cardShadow = {
  // Umbra rămâne neagră indiferent de temă (colors.text e deschis în dark mode).
  shadowColor: '#000',
  shadowOpacity: 0.3,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;
