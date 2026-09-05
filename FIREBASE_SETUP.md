# Papa Golf Shared Data Beta — Firebase setup

This is the first backend test only. Do not enter service-account keys, private keys, passwords, or admin SDK credentials into Papa Golf.

## Firebase console setup
1. Create or choose a Firebase project.
2. Create a Firestore Database in production mode.
3. Enable **Authentication → Sign-in method → Anonymous**.
4. Copy the Firebase **Project ID** and the web app **API key** into Papa Golf → Welcome / Gateways → Shared Data → Backend connection settings.

## Firestore security rules for the Alpha test
Use rules equivalent to the following, then publish them:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /papaGolfGateways/{gatewayId} {
      allow read: if resource.data.published == true;
      allow create: if request.auth != null
                    && request.resource.data.ownerUid == request.auth.uid;
      allow update, delete: if request.auth != null
                            && resource.data.ownerUid == request.auth.uid
                            && request.resource.data.ownerUid == request.auth.uid;
    }
  }
}
```

These rules make published Gateway data publicly readable while restricting writes to the anonymous owner identity that first created the document. This is suitable only for the current Alpha. Real Papa Golf accounts will replace anonymous ownership later.

## Acceptance test
1. In Shared Data, save Project ID and Web API key.
2. Tap **Test connection**.
3. Tap **Publish Current Welcome**.
4. Copy the Permanent Link and open it on the iPad.
5. Change a visible Welcome field on the iPhone, save it, and tap Publish Current Welcome again.
6. Refresh the same permanent link on the iPad. The new value should appear without changing the URL or QR.
