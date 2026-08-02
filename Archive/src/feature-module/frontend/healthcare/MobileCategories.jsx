import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { axiosCommonInstance,  } from "../../../Apiservice";
import { getImageUrl } from "../../../utils/index";
import { useCartContext } from "../../../context/CartContext";

const MobileCategories = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { getUniqueItemCount } = useCartContext();
  const cartCount = getUniqueItemCount();

  const fetchCategories = async () => {
    try {
      const response = await axiosCommonInstance.get("category/list");
      const data = await response.data;
      if (data?.data?.category && Array.isArray(data.data.category)) {
        setCategories(data.data.category);
        const categoryIdParam = searchParams.get('category');
        if (categoryIdParam) {
          const foundCategory = data.data.category.find(cat => cat._id === categoryIdParam);
          if (foundCategory) {
            setSelectedCategory(foundCategory);
          } else if (data.data.category.length > 0) {
            setSelectedCategory(data.data.category[0]);
            setSearchParams({ category: data.data.category[0]._id });
          }
        } else if (data.data.category.length > 0) {
          setSelectedCategory(data.data.category[0]);
          setSearchParams({ category: data.data.category[0]._id });
        }
      }
    } catch (error) {
      toast.error("Error fetching categories:", error);
    }
  };
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSearchParams({ category: category._id });
  };

  const handleCategoryClick = (category) => {
    handleCategorySelect(category);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const getSubcategories = () => {
    if (!selectedCategory || !selectedCategory.subcategories) return [];
    return selectedCategory.subcategories;
  };

  const handleSubcategoryClick = (subcategory) => {
    if (!selectedCategory || !subcategory?.slug) return;
    const service = selectedCategory.slug;
    navigate(`/${service}/all?categories=${subcategory.slug}`);
  };

  return (
    <>
      <div className="footers-wrapper overflow-hidden">
        <div className="footers-header">
          <div className="d-flex align-items-center justify-content-between">
            <div onClick={() => navigate("/")} className="cursor-pointer">
              <i className="fa-solid fa-arrow-left footers-arrow" />
            </div>
            <div className="text-center flex-grow-1">Categories</div>
            <div
              onClick={() => navigate("/cart")}
              className="cursor-pointer relative flex items-center justify-center"
            >
              <i className="fa-solid fa-cart-shopping footers-icon" />
              {cartCount > 0 && (
                <span
                  className={`absolute top-[-4px] right-[-4px] bg-[#ef4444] text-white rounded-full flex items-center justify-center font-bold border-2 border-solid border-white ${cartCount > 9 ? "min-w-[20px] h-[20px]" : "min-w-[18px] h-[18px]"} ${cartCount > 99 ? "text-[9px] px-[4px]" : "text-[11px] px-0"}`}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="container-fluid mt-0 pt-0">
          <div className="row">
            <div
              className="col-3 footers-category-sidebar overflow-y-auto max-h-[calc(100vh-100px)] overflow-x-hidden"
            >
              {categories.map((category) => (
                <a
                  key={category._id}
                  href={`#category-${category._id}`}
                  className={`footers-item cursor-pointer no-underline block ${
                    selectedCategory?._id === category._id ? "active" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleCategoryClick(category);
                  }}
                >
                  <img
                    src={
                      category.files && category.files.length > 0
                        ? getImageUrl(category.files[0])
                        : ""
                    }
                    alt="categoryImage"
                  />
                  <div>{category.name.toUpperCase()}</div>
                </a>
              ))}
            </div>
            <div className="col-9 category-main">
              <div
                className="category-content overflow-y-auto max-h-[calc(100vh-100px)]"
              >
                {selectedCategory && (
                  <>
                    <h6
                      className="footers-title"
                      id={`category-${selectedCategory._id}`}
                    >
                      {selectedCategory.name.toUpperCase()}
                    </h6>
                    <div className="row">
                      {getSubcategories().map((subcategory) => (
                        <div key={subcategory._id} className="col-6">
                          <div
                            className="footers-card cursor-pointer"
                            onClick={() => handleSubcategoryClick(subcategory)}
                          >
                            <img
                              src={
                                subcategory.files &&
                                subcategory.files.length > 0
                                  ? getImageUrl(subcategory.files[0])
                                  : "/assets/default.png"
                              }
                              alt="categoryImage"
                            />
                            <p
                              className="whitespace-nowrap overflow-hidden text-ellipsis"
                            >
                              {subcategory.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {!selectedCategory && (
                  <div className="text-center p-4">
                    <p>No category selected</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileCategories;
