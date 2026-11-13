/*
 * Prieteniile dintre celelalte persoane (mock), ca să putem arăta prietenii cuiva și pe cei comuni.
 * Fiecare pereche apare o singură dată; relația e în ambele sensuri.
 * Prieteniile tale sunt separat, în src/services/friendsService.ts.
 */
export const MOCK_FRIENDSHIPS: [string, string][] = [
  ['p1', 'p2'],
  ['p1', 'p3'],
  ['p1', 'p5'],
  ['p1', 'p7'],
  ['p2', 'p4'],
  ['p2', 'p5'],
  ['p2', 'p6'],
  ['p2', 'p8'],
  ['p3', 'p5'],
  ['p3', 'p7'],
  ['p4', 'p6'],
  ['p4', 'p8'],
  ['p5', 'p7'],
  ['p6', 'p8'],
];
