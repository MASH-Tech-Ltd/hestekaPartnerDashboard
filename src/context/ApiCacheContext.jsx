import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import api from '../utils/api';

const ApiCacheContext = createContext();

export const ApiCacheProvider = ({ children }) => {
  const [cache, setCache] = useState({});
  const inFlightRequests = useRef({});

  const fetchWithCache = useCallback(async (url, options = {}) => {
    const { force = false, expireIn = 5 * 60 * 1000 } = options;
    const now = Date.now();

    // Return cached if valid and not forced
    if (!force && cache[url] && now - cache[url].timestamp < expireIn) {
      return cache[url].data;
    }

    // Avoid multiple identical requests in-flight
    if (inFlightRequests.current[url]) {
      return inFlightRequests.current[url];
    }

    const request = api.get(url).then(res => {
      setCache(prev => ({
        ...prev,
        [url]: { data: res, timestamp: Date.now() }
      }));
      delete inFlightRequests.current[url];
      return res;
    }).catch(err => {
      delete inFlightRequests.current[url];
      throw err;
    });

    inFlightRequests.current[url] = request;
    return request;
  }, [cache]);

  const invalidateCache = useCallback((urlPattern) => {
    setCache(prev => {
      const newCache = { ...prev };
      Object.keys(newCache).forEach(key => {
        if (key.includes(urlPattern)) {
          delete newCache[key];
        }
      });
      return newCache;
    });
  }, []);

  const getCachedData = useCallback((url) => {
    const cached = cache[url];
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }
    return null;
  }, [cache]);

  return (
    <ApiCacheContext.Provider value={{ fetchWithCache, invalidateCache, getCachedData }}>
      {children}
    </ApiCacheContext.Provider>
  );
};

export const useApiCache = () => useContext(ApiCacheContext);
