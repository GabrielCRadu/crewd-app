import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import type { DocumentReference } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import * as functionsV1 from 'firebase-functions/v1';

/*
 * Curățenia după ștergerea unui cont (audit 2026-11-14): aplicația nu mai poate șterge profilul users/{uid}
 * (altfel l-ai recrea cu altă dată a nașterii), așa că îl șterge această funcție, când contul dispare din
 * Firebase Auth. Tot aici: mesajele de grup ale contului devin „Cont șters” (fără text), iar evidența
 * grupurilor (memberships/) se șterge. Restul (grupuri, prietenii, DM-uri, username) îl șterge aplicația înainte.
 */

const DELETED_NAME = 'Cont șters';

async function deleteInBatches(refs: DocumentReference[]) {
  const db = getFirestore();
  for (let i = 0; i < refs.length; i += 400) {
    const batch = db.batch();
    refs.slice(i, i + 400).forEach((r) => batch.delete(r));
    await batch.commit();
  }
}

export const cleanupDeletedUser = functionsV1
  .region('europe-west1')
  .auth.user()
  .onDelete(async (user) => {
    const db = getFirestore();
    const uid = user.uid;

    // Mesajele din grupuri: rămân în conversația celorlalți, dar fără nume și fără text.
    const messages = await db.collectionGroup('messages').where('authorUid', '==', uid).get();
    for (let i = 0; i < messages.docs.length; i += 400) {
      const batch = db.batch();
      messages.docs.slice(i, i + 400).forEach((m) => batch.update(m.ref, { authorName: DELETED_NAME, text: '' }));
      await batch.commit();
    }

    // Grupurile în care contul a rămas (ex. intrat ocolind aplicația): îl scoatem și de acolo (audit).
    const memberships = await db.collection('memberships').doc(uid).collection('events').get();
    for (const m of memberships.docs) {
      const groupId = m.data().groupId;
      if (typeof groupId !== 'string') continue;
      const ref = db.collection('events').doc(m.id).collection('groups').doc(groupId);
      await db.runTransaction(async (tx) => {
        const g = await tx.get(ref);
        const uids: string[] = g.data()?.memberUids ?? [];
        if (!g.exists || !uids.includes(uid)) return;
        tx.update(ref, { memberUids: uids.filter((u) => u !== uid), [`members.${uid}`]: FieldValue.delete() });
      });
    }
    await deleteInBatches([...memberships.docs.map((d) => d.ref), db.collection('memberships').doc(uid)]);
    await deleteInBatches([db.collection('profiles').doc(uid), db.collection('users').doc(uid)]);

    logger.info('account_cleanup', { messages: messages.size, memberships: memberships.size });
  });
