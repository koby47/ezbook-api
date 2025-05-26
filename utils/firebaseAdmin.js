import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import {readFileSync} from "fs";


//Load service account credentials
// const serviceAccount =JSON.parse(readFileSync(new URL("../config/firebaseServiceAccountkey.json",import.meta.url)));

const serviceAccount =JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

//Initialize Firebase Admin if not alread initialized
if (!admin.apps.length){
    admin.initializeApp({
        credential:admin.credential.cert(serviceAccount),
    });
}

export const verifyGoogleToken = async(idToken) =>{
    const decodedToken = await getAuth().verifyIdToken(idToken);
    return decodedToken;
};