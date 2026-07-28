import React, { useState, useEffect, useRef } from "react"
import { fetchCategoryList } from "../Apiservice";
import HealthcareNavigation from "../feature-module/frontend/healthcare/HealthcareNavigation";
import { toast } from "react-toastify";

const CategoryProvider = ({ isLoading }) => {
  const [categories, setCategories] = useState([]);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchCategories = async () => {
      try {
        const categoryData = await fetchCategoryList();
        setCategories(categoryData);
      } catch (err) {
        toast.error("Error fetching categories: " + err.message);
      }
    };

    fetchCategories();
  }, []);

  return <HealthcareNavigation categories={categories} isLoading={isLoading} />;
};

export default CategoryProvider;
