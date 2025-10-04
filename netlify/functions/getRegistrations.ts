import { getStore } from "@netlify/blobs";
import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  try {
    const store = getStore('registrations');
    const { blobs } = await store.list();

    // Fetch all registration objects in parallel
    const registrations = await Promise.all(
        blobs.map(blob => store.get(blob.key, { type: 'json' }))
    );
    
    // Filter out any potential null/undefined entries if a get failed unexpectedly
    const validRegistrations = registrations.filter(Boolean);

    return {
      statusCode: 200,
      body: JSON.stringify({ registrations: validRegistrations }),
    };
  } catch (error) {
    console.error('Error fetching registrations:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred while fetching registrations.';
    return {
      statusCode: 500,
      body: JSON.stringify({ message: errorMessage }),
    };
  }
};
