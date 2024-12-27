import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFile } from 'fs/promises';

// Initialize without credentials for emulator
const app = initializeApp({
    projectId: 'demo-timeto'
});

// Connect to emulator with correct port
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

// Configure Firestore
const db = getFirestore(app);
const settings = {
    ignoreUndefinedProperties: true,
    timestampsInSnapshots: true
};
db.settings(settings);

function mergeFieldTypes(existing, newTypes) {
    const merged = { ...existing };
    Object.entries(newTypes).forEach(([key, value]) => {
        if (!(key in merged)) {
            merged[key] = value;
        } else if (merged[key] !== value) {
            // If types differ, mark as mixed
            merged[key] = `mixed(${merged[key]},${value})`;
        }
    });
    return merged;
}

function analyzeObjectStructure(obj, depth = 0) {
    if (depth > 3) return 'object{...}'; // Prevent infinite recursion
    
    if (obj === null) return 'null';
    if (Array.isArray(obj)) {
        const elementTypes = new Set(obj.map(v => {
            if (v === null) return 'null';
            if (Array.isArray(v)) return 'array';
            if (typeof v === 'object') {
                if ('_seconds' in v && '_nanoseconds' in v) return 'timestamp';
                return analyzeObjectStructure(v, depth + 1);
            }
            return typeof v;
        }));
        return `array<${Array.from(elementTypes).join('|')}>`;
    }
    if (typeof obj === 'object') {
        if ('_seconds' in obj && '_nanoseconds' in obj) return 'timestamp';
        const fields = Object.entries(obj).reduce((acc, [key, value]) => {
            acc[key] = value === null ? 'null' :
                Array.isArray(value) ? analyzeObjectStructure(value, depth + 1) :
                typeof value === 'object' ? analyzeObjectStructure(value, depth + 1) :
                typeof value;
            return acc;
        }, {});
        return `object{${JSON.stringify(fields)}}`;
    }
    return typeof obj;
}

async function extractDocumentStructure(doc) {
    const docData = doc.data();
    return Object.entries(docData).reduce((acc, [key, value]) => {
        acc[key] = analyzeObjectStructure(value);
        return acc;
    }, {});
}

async function processCollection(collectionRef, path = '', depth = 0) {
    if (depth > 5) return null; // Prevent infinite recursion
    
    console.log(`Processing collection${path ? ' at ' + path : ''}: ${collectionRef.id}`);
    
    const schema = {
        documentStructure: {},
        subcollections: {},
        documentCount: 0,
        sampleDocumentIds: []
    };
    
    try {
        // Get documents with pagination to sample from different parts
        const batchSize = 10;
        let processedDocs = new Set();
        let lastDoc = null;
        let totalDocs = 0;
        
        // Get up to 3 batches of documents
        for (let i = 0; i < 3; i++) {
            let query = collectionRef.limit(batchSize);
            if (lastDoc) {
                query = query.startAfter(lastDoc);
            }
            
            const snapshot = await query.get();
            if (snapshot.empty) break;
            
            totalDocs += snapshot.size;
            lastDoc = snapshot.docs[snapshot.docs.length - 1];
            
            for (const doc of snapshot.docs) {
                if (processedDocs.has(doc.id)) continue;
                processedDocs.add(doc.id);
                
                schema.sampleDocumentIds.push(doc.id);
                const docStructure = await extractDocumentStructure(doc);
                schema.documentStructure = mergeFieldTypes(schema.documentStructure, docStructure);
                
                // Process subcollections recursively
                const subcollections = await doc.ref.listCollections();
                for (const subcoll of subcollections) {
                    const subPath = `${path}${collectionRef.id}/${doc.id}/`;
                    const subSchema = await processCollection(subcoll, subPath, depth + 1);
                    if (subSchema) {
                        schema.subcollections[subcoll.id] = subSchema;
                    }
                }
            }
        }
        
        schema.documentCount = totalDocs;
        return schema;
    } catch (error) {
        console.error(`Error processing collection ${collectionRef.id}:`, error.message);
        return null;
    }
}

async function getFirestoreSchema() {
    const schema = {};
    
    try {
        console.log('Starting schema extraction...');
        
        // Get root collections
        const collections = await db.listCollections();
        console.log(`Found ${collections.length} root collections`);
        
        for (const collection of collections) {
            const result = await processCollection(collection);
            if (result) {
                schema[collection.id] = result;
            }
        }
        
        return schema;
    } catch (error) {
        console.error('Error in main process:', error.message);
        return schema;
    }
}

async function saveSchemaToFile(schema) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `schema_structure_${timestamp}.json`;
    
    try {
        await writeFile(
            filename,
            JSON.stringify(schema, null, 2),
            'utf8'
        );
        console.log(`Schema structure saved to ${filename}`);
    } catch (error) {
        console.error('Error saving schema to file:', error.message);
    }
}

// Add process error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

getFirestoreSchema().then(async schema => {
    console.log('\nSchema extraction complete!');
    await saveSchemaToFile(schema);
}).catch(err => {
    console.error("Error fetching schema:", err.message);
});