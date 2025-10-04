import { getStore } from "@netlify/blobs";
import type { Handler } from "@netlify/functions";
import type { Registration } from '../../types';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  try {
    const registration = JSON.parse(event.body || '{}') as Registration;
    if (!registration || !registration.id) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Invalid registration data provided.' }) };
    }

    const store = getStore('registrations');
    
    // Optional: Check if the item exists before updating
    const existing = await store.get(registration.id);
    if (!existing) {
        return { statusCode: 404, body: JSON.stringify({ message: 'Registration not found.' }) };
    }

    await store.set(registration.id, JSON.stringify(registration));

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Registration updated successfully' })
    };
  } catch (error) {
    console.error('Error updating registration:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return {
      statusCode: 500,
      body: JSON.stringify({ message: errorMessage }),
    };
  }
};
