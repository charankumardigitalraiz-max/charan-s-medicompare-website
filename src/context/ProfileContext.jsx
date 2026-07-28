import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { axiosUserInstance } from "../Apiservice";

const defaultProfileValue = {
  profile: null,
  isLoading: false,
  error: null,
  refetchProfile: () => {},
  clearProfile: () => {},
};

const ProfileContext = createContext(defaultProfileValue);

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is logged in
  const isLoggedIn = useCallback(() => {
    return !!localStorage.getItem("medicomparestoken");
  }, []);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("medicomparestoken");
    if (!token) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axiosUserInstance.get("profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = response?.data?.data?.user || {};
      setProfile(userData);
    } catch (err) {
      setError(err);
      
      if (err.response?.status === 401) {
        localStorage.removeItem("medicomparestoken");
        setProfile(null);
      } else if (err.response?.status === 403) {
        localStorage.removeItem("medicomparestoken");
        localStorage.removeItem("fcmToken");
        alert("Access forbidden, please login again");
        window.location.href = "/login";
        setProfile(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refetch profile
  const refetchProfile = useCallback(() => {
    if (isLoggedIn()) {
      fetchProfile();
    }
  }, [fetchProfile, isLoggedIn]);

  // Clear profile (for logout)
  const clearProfile = useCallback(() => {
    setProfile(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (isLoggedIn()) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [isLoggedIn, fetchProfile]);

  useEffect(() => {
    const handleTokenChange = (e) => {
      if (e.key === "medicomparestoken") {
        if (e.newValue && !e.oldValue) {
          fetchProfile();
        } else if (!e.newValue && e.oldValue) {
          clearProfile();
        }
      }
    };

    const handleUserLoggedIn = () => {
      fetchProfile();
    };

    const handleUserLoggedOut = () => {
      clearProfile();
    };

    window.addEventListener("storage", handleTokenChange);
    window.addEventListener("userLoggedIn", handleUserLoggedIn);
    window.addEventListener("userLoggedOut", handleUserLoggedOut);

    return () => {
      window.removeEventListener("storage", handleTokenChange);
      window.removeEventListener("userLoggedIn", handleUserLoggedIn);
      window.removeEventListener("userLoggedOut", handleUserLoggedOut);
    };
  }, [fetchProfile, clearProfile]);

  const value = {
    profile,
    isLoading,
    error,
    refetchProfile,
    clearProfile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context._isDefault) {
    return defaultProfileValue;
  }
  return context;
};

export default ProfileContext;
