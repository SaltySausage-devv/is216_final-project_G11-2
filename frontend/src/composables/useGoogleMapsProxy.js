/**
 * Google Maps API Proxy Composable
 * Uses backend API to proxy Google Maps requests and keep API key secure
 */

import { ref } from 'vue';
import axios from 'axios';

export function useGoogleMapsProxy() {
  const isLoading = ref(false);
  const error = ref(null);
  
  // Generate a unique session token for autocomplete sessions
  const generateSessionToken = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Get autocomplete predictions for a location input
   * @param {string} input - The text to search for
   * @param {string} sessionToken - Optional session token for billing optimization
   * @returns {Promise<Array>} Array of prediction objects
   */
  const getAutocompletePredictions = async (input, sessionToken = null) => {
    if (!input || input.trim().length === 0) {
      return [];
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await axios.post(`/api/maps/autocomplete`, {
        input: input.trim(),
        sessionToken: sessionToken || generateSessionToken()
      });

      if (response.data && response.data.predictions) {
        return response.data.predictions.map(pred => ({
          placeId: pred.placeId,
          description: pred.description,
          mainText: pred.structuredFormatting?.main_text || pred.description,
          secondaryText: pred.structuredFormatting?.secondary_text || '',
          types: pred.types || []
        }));
      }

      return [];
    } catch (err) {
      console.error('Autocomplete error:', err);
      error.value = err.response?.data?.error || 'Failed to get autocomplete predictions';
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Get place details by place ID
   * @param {string} placeId - The Google Place ID
   * @returns {Promise<Object>} Place details object
   */
  const getPlaceDetails = async (placeId) => {
    if (!placeId) {
      throw new Error('Place ID is required');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`/api/maps/place-details/${placeId}`);

      if (response.data) {
        return {
          placeId: response.data.placeId,
          name: response.data.name,
          formattedAddress: response.data.formattedAddress,
          location: response.data.location,
          rating: response.data.rating,
          userRatingsTotal: response.data.userRatingsTotal,
          types: response.data.types,
          website: response.data.website,
          phoneNumber: response.data.formattedPhoneNumber
        };
      }

      return null;
    } catch (err) {
      console.error('Place details error:', err);
      error.value = err.response?.data?.error || 'Failed to get place details';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Geocode an address to get coordinates
   * @param {string} address - The address to geocode
   * @returns {Promise<Object>} Location object with lat/lng
   */
  const geocodeAddress = async (address) => {
    if (!address) {
      throw new Error('Address is required');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await axios.post(`/api/maps/geocode`, {
        address
      });

      if (response.data && response.data.location) {
        return {
          latitude: response.data.location.latitude,
          longitude: response.data.location.longitude,
          formattedAddress: response.data.formattedAddress,
          placeId: response.data.placeId
        };
      }

      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      error.value = err.response?.data?.error || 'Failed to geocode address';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error,
    getAutocompletePredictions,
    getPlaceDetails,
    geocodeAddress,
    generateSessionToken
  };
}

