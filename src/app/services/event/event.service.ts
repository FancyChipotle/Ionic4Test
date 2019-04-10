import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  public eventListRef: firebase.firestore.CollectionReference;

  constructor() {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.eventListRef = firebase.firestore().collection(`/userProfile/${user.uid}/eventList`);
      }
    });
  }

  createEvent(eventName: string, eventDate: string,
    eventPrice: number, eventCost: number): Promise<firebase.firestore.DocumentReference> {
      return this.eventListRef.add({
        name: eventName,
        date: eventDate,
        price: eventPrice * 1,
        cost: eventCost * 1,
        revenue: eventCost * -1
      });
  }

  getEventList(): firebase.firestore.CollectionReference {
    return this.eventListRef;
  }

  getEventDetail(eventID: string): firebase.firestore.DocumentReference {
    return this.eventListRef.doc(eventID);
  }

  addGuest(guestName: string, eventID: string, eventPrice: number,
    guestPicture: string = null): Promise<void> {
      return this.eventListRef
        .doc(eventID)
        .collection('guestList')
        .add({ guestName })
        .then((newGuest) => {
          return firebase.firestore().runTransaction(transaction => {
            return transaction.get(this.eventListRef.doc(eventID)).then(eventDoc => {
              const newRevenue = eventDoc.data().revenue + eventPrice;
              transaction.update(this.eventListRef.doc(eventID), { revenue: newRevenue });

              if (guestPicture != null) {
                const storageRef = firebase
                  .storage()
                  .ref(`/guestProfile/${newGuest.id}/profilePicture.png`);

                return storageRef
                  .putString(guestPicture, 'base64', { contentType: 'image/png' })
                  .then(() => {
                    return storageRef.getDownloadURL().then(downloadURL => {
                      return this.eventListRef
                        .doc(eventID)
                        .collection('guestList')
                        .doc(newGuest.id)
                        .update({ profilePicture: downloadURL });
                    });
                  });
              }
            });
          });
        });
  }
}
