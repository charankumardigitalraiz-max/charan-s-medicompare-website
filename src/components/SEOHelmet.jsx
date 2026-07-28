import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { imgUrl, axiosCommonInstance } from '../Apiservice';

export default function SEOHelmet({ page }) {
  const [seoData, setSeoData] = useState(null);

  useEffect(() => {
    const fetchSEO = async () => {
      try {
        const response = await axiosCommonInstance.get(`/seo/${page}`);
        if (response.data?.success && response.data?.data) {
          setSeoData(response.data.data);
        }
      } catch (error) {
        console.error(`Error fetching SEO data for ${page}:`, error);
      }
    };
    if (page) {
      fetchSEO();
    }
  }, [page]);

  if (!seoData) return null;

  return (
    <Helmet>
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.metaDescription} />
      {seoData.keywords && seoData.keywords.length > 0 && (
        <meta name="keywords" content={seoData.keywords.join(', ')} />
      )}
    </Helmet>
  );
}
