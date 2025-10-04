import { getStore } from "@netlify/blobs";
import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
    try {
        const store = getStore('registrations');
        const { blobs } = await store.list();

        // Fetch all blob contents in parallel
        const registrations = await Promise.all(
            blobs.map(blob => store.get(blob.key, { type: 'json' }))
        );

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrations),
        };
    } catch (error) {
        console.error('Error fetching registrations:', error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ message: error instanceof Error ? error.message : 'An unknown server error occurred.' }) 
        };
    }
};
