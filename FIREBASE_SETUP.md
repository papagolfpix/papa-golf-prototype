# Papa Golf Shared Data Beta — secure Firebase setup

This build deliberately keeps the existing local Papa Golf data untouched until **Publish Current Welcome** succeeds.

## One-time Firebase console setup
1. Firebase project: **Papa Golf Platform**.
2. Firestore: Standard edition, `(default)` database, `asia-southeast1 (Singapore)`, Production mode.
3. Register one Firebase Web app. Papa Golf only needs the **Project ID** and **Web API key**. Do not enter service-account/private keys.
4. Firebase Authentication → Get started → Sign-in method → **Anonymous** → Enable → Save.
5. Papa Golf → Welcome / Gateways → Shared Data → Secure setup assistant:
   - save Project ID + Web API key;
   - tap **Create / test owner identity**;
   - copy the exact generated Firestore rules;
   - Firebase → Firestore → Rules → replace the default deny-all rules → Publish.
6. Back in Papa Golf, tap **Publish Current Welcome**.

## Why the generated rules are safer than generic Alpha rules
The rules are generated with the exact Firebase owner UID created on the admin device. They:
- allow `get` only for a known published Gateway (or its owner);
- explicitly block `list`, preventing casual collection browsing;
- allow create/update/delete only to that exact owner UID;
- keep the public guest page read-only.

Do not replace them with `allow read, write: if true` or Test Mode rules.

## Important Alpha identity note
For this Beta the owner identity is Firebase Anonymous Authentication stored in this browser. Do not clear Safari website data after publishing, because the Firestore rules will be bound to that owner UID. Proper named Papa Golf accounts will replace this temporary owner identity before production.

## Acceptance test
1. Publish Magic Dragon Villa once.
2. Copy the Permanent Link and open it on the iPad/another phone.
3. Edit one visible Welcome field on the iPhone.
4. Save and tap Publish Current Welcome again.
5. Refresh the **same** permanent link on the other device.
6. Confirm the value changes without changing the URL or QR.
