import { getStore } from "@netlify/blobs";
import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ message: 'Method Not Allowed' })
        };
    }

    try {
        const { id } = JSON.parse(event.body || '{}');
        if (!id) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ message: 'Bad Request: Missing registration ID.' })
            };
        }
        const store = getStore('registrations');
        await store.delete(id);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Delete successful' }),
        };
    } catch (error) {
        console.error('Error deleting registration:', error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ message: error instanceof Error ? error.message : 'An unknown server error occurred.' }) 
        };
    }
};
