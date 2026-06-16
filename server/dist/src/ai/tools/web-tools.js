export const geocodeLocationTool = {
    name: 'geocode_location',
    description: 'Convert a city name or address into geographic coordinates (latitude and longitude).',
    parameters: {
        type: 'object',
        properties: {
            query: { type: 'string', description: 'The city name or address to geocode (e.g., "Mumbai", "New York")' }
        },
        required: ['query']
    },
    handler: async (args) => {
        try {
            let data;
            const headers = { 'User-Agent': 'SpaceTrackerAI/1.0' };
            try {
                const axiosModule = await import('axios');
                const axios = axiosModule.default || axiosModule;
                const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                    params: {
                        q: args.query,
                        format: 'json',
                        limit: 1
                    },
                    headers
                });
                data = response.data;
            }
            catch (importError) {
                if (importError.code === 'ERR_MODULE_NOT_FOUND' || importError.message?.includes('Cannot find module')) {
                    // Fallback to fetch
                    const url = new URL('https://nominatim.openstreetmap.org/search');
                    url.searchParams.append('q', args.query);
                    url.searchParams.append('format', 'json');
                    url.searchParams.append('limit', '1');
                    const response = await fetch(url.toString(), { headers });
                    data = await response.json();
                }
                else {
                    throw importError;
                }
            }
            if (data && data.length > 0) {
                const result = data[0];
                return {
                    latitude: parseFloat(result.lat),
                    longitude: parseFloat(result.lon),
                    displayName: result.display_name
                };
            }
            return { error: 'Location not found' };
        }
        catch (error) {
            return { error: `Failed to geocode location: ${error.message}` };
        }
    }
};
