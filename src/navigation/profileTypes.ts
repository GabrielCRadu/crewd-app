/** Ecranele din stiva tab-ului Profil. */
export type ProfileStackParamList = {
  ProfileHome: undefined;
  /** Poză, nume, vârstă, oraș, descriere și preferințe. */
  EditProfile: undefined;
  /** Prietenii tăi și cererile de prietenie. */
  FriendsList: undefined;
  /** Profilul altei persoane (din lista de prieteni). */
  PersonProfile: { personId: string };
  /** Prietenii unei persoane (toți sau doar cei comuni). */
  PersonFriends: { personId: string };
  /** Fișa publică a cuiva (poza mică, numele, @username), deschisă din codul lui QR. */
  PublicProfile: { username: string };
  /** Setările contului (din meniul cu trei linii de pe profil). */
  Settings: undefined;
  /** Politica de confidențialitate (din Setări). */
  PrivacyPolicy: undefined;
};
