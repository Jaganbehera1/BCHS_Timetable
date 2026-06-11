import {
  ref,
  get,
  set,
  update,
  remove,
  query,
  orderByChild,
  limitToFirst,
  equalTo,
} from 'firebase/database';
import { db } from './firebase';

// Generic functions for common operations with Realtime Database
export async function getCollectionData<T>(
  collectionName: string,
  constraints: any[] = []
): Promise<(T & { id: string })[]> {
  try {
    const snapshot = await get(ref(db, collectionName));
    if (!snapshot.exists()) {
      return [];
    }
    const data = snapshot.val();
    return Object.keys(data || {}).map(id => ({
      ...data[id],
      id,
    } as T & { id: string }));
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    return [];
  }
}

export async function getDocumentData<T>(
  collectionName: string,
  documentId: string
): Promise<(T & { id: string }) | null> {
  try {
    const snapshot = await get(ref(db, `${collectionName}/${documentId}`));
    if (snapshot.exists()) {
      return {
        ...snapshot.val(),
        id: snapshot.key,
      } as T & { id: string };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching document ${documentId}:`, error);
    return null;
  }
}

export async function addDocument(
  collectionName: string,
  data: any
): Promise<string | null> {
  try {
    const newRef = ref(db, `${collectionName}/${Date.now()}`);
    await set(newRef, {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return newRef.key || null;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    return null;
  }
}

export async function setDocument(
  collectionName: string,
  documentId: string,
  data: any
): Promise<boolean> {
  try {
    const docRef = ref(db, `${collectionName}/${documentId}`);
    await set(docRef, {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error(`Error setting document ${documentId}:`, error);
    return false;
  }
}

export async function updateDocument(
  collectionName: string,
  documentId: string,
  data: any
): Promise<boolean> {
  try {
    const docRef = ref(db, `${collectionName}/${documentId}`);
    await update(docRef, {
      ...data,
      updated_at: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error(`Error updating document ${documentId}:`, error);
    return false;
  }
}

export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<boolean> {
  try {
    await remove(ref(db, `${collectionName}/${documentId}`));
    return true;
  } catch (error) {
    console.error(`Error deleting document ${documentId}:`, error);
    return false;
  }
}

export async function queryWhere(
  collectionName: string,
  field: string,
  operator: any,
  value: any,
  orderByField?: string,
  limitCount?: number
): Promise<any[]> {
  try {
    const snapshot = await get(ref(db, collectionName));
    if (!snapshot.exists()) {
      return [];
    }
    const data = snapshot.val();
    let results = Object.keys(data || {}).map(id => ({
      ...data[id],
      id,
    }));
    
    // Filter by field and value
    results = results.filter(item => {
      const fieldValue = item[field];
      switch (operator) {
        case '==':
          return fieldValue === value;
        case '>':
          return fieldValue > value;
        case '<':
          return fieldValue < value;
        case '>=':
          return fieldValue >= value;
        case '<=':
          return fieldValue <= value;
        default:
          return false;
      }
    });
    
    // Sort by field if provided
    if (orderByField) {
      results.sort((a, b) => {
        const aVal = a[orderByField];
        const bVal = b[orderByField];
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      });
    }
    
    // Limit results if provided
    if (limitCount) {
      results = results.slice(0, limitCount);
    }
    
    return results;
  } catch (error) {
    console.error(`Error querying ${collectionName}:`, error);
    return [];
  }
}

export async function countDocuments(
  collectionName: string,
  constraints: any[] = []
): Promise<number> {
  try {
    const snapshot = await get(ref(db, collectionName));
    if (!snapshot.exists()) {
      return 0;
    }
    return Object.keys(snapshot.val() || {}).length;
  } catch (error) {
    console.error(`Error counting documents in ${collectionName}:`, error);
    return 0;
  }
}
