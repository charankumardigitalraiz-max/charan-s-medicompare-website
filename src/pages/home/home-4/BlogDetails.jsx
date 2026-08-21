import React, { useEffect, useState } from "react";
import Home2Header from "../../../components/layout/Header-k";
import Home2Footer from "../../../components/layout/Footer-f";
import { Link, useParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../../../Apiservice";
import toast from "react-hot-toast";
import { getImageUrl } from "../../../utils";
import PageLoader from "../../../components/ui/PageLoader.jsx";
import BackButton from "../../../components/ui/BackButton.jsx";

const BlogDetailsj = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [bloglist, setbloglist] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  const countWords = (text) => {
    return text?.split(/\s+/).filter((word) => word.length > 0).length || 0;
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getBySingleBlog = async () => {
    try {
      const response = await axiosInstance.get(`blog/single/${slug}`);
      setBlogs(response?.data?.data?.blog);
    } catch (error) {
      toast.error("Error fetching blog:", error);
    } finally {
      setLoading(false);
    }
  };
  const getByBlogList = async () => {
    try {
      const response = await axiosInstance.get(`blog/list`);
      setbloglist(response?.data?.data?.list);
    } catch (error) {
      toast.error("Error fetching blog:", error);
    }
  };

  useEffect(() => {
    if (slug) {
      setLoading(true);
      getBySingleBlog();
    }
    getByBlogList();
  }, [slug]);

  return (
    <>
      {loading ? (
        <PageLoader />
      ) : (
        <>
          <Home2Header />
          <div className="relative py-12 overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/assets/Medicompares Background.png')" }}>
            <div className="max-w-7xl mx-auto px-4">
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 min-h-[48px] z-10 w-full">
                <div className="md:absolute md:left-0">
                  <BackButton className="z-20" />
                </div>
                <h1 className="!text-[20px] md:!text-[28px] !font-bold !text-gray-900 !text-center !w-full !px-4 md:!px-28 !leading-snug">
                  {blogs?.title}
                </h1>
              </div>
            </div>
            {/* <div className="absolute inset-0 pointer-events-none">
              <img
                src="/assets/img/bg/breadcrumb-bg-01.png"
                alt="img"
                className="absolute left-0 bottom-0 max-h-full"
              />
              <img
                src="/assets/img/bg/breadcrumb-bg-02.png"
                alt="img"
                className="absolute right-0 top-0 max-h-full"
              />
              <img
                src="/assets/img/bg/breadcrumb-icon.png"
                alt="img"
                className="absolute left-10 top-1/4 animate-pulse"
              />
              <img
                src="/assets/img/bg/breadcrumb-icon.png"
                alt="img"
                className="absolute right-10 bottom-1/4 animate-pulse"
              />
            </div> */}
          </div>
          <div className="py-12 bg-white">
            <div className="max-w-[1400px] mx-auto px-4">
              <div className="flex flex-wrap -mx-4">
                <div className="w-full lg:w-2/3 px-4 rounded-sm">
                  <div className="space-y-6">
                    {/* <h5 className="text-2xl font-bold text-gray-955 mb-3">{blogs?.title || "Blog Title"}</h5> */}
                    <div className="bg-white overflow-hidden p-0">
                      <div className="w-full flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden min-h-[200px] mb-6">
                        <img
                          alt="blog-image"
                          src={getImageUrl(blogs?.files?.[0])}
                          className="w-full h-auto max-h-[480px] max-lg:max-h-[360px] object-contain object-center"
                        />
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-4">
                          <ul className="flex items-center gap-4 text-sm text-gray-500">
                            <li>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-900 text-white">
                                {blogs?.category?.name || "Health Tips"}
                              </span>
                            </li>
                            <li className="flex items-center gap-1.5">
                              <i className="isax isax-calendar" />
                              <span>
                                {new Date(blogs?.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                ) || ""}
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div
                        className="text-black leading-relaxed text-[15px] max-w-none [&_h1]:!text-[22px] [&_h1]:!font-bold [&_h1]:!text-black [&_h1]:!mt-6 [&_h1]:!mb-3 [&_h1_*]:!text-[22px] [&_h1_*]:!font-bold [&_h1_*]:!text-black [&_h2]:!text-[20px] [&_h2]:!font-bold [&_h2]:!text-black [&_h2]:!mt-6 [&_h2]:!mb-3 [&_h2_*]:!text-[20px] [&_h2_*]:!font-bold [&_h2_*]:!text-black [&_h3]:!text-[18px] [&_h3]:!font-bold [&_h3]:!text-black [&_h3]:!mt-5 [&_h3]:!mb-2.5 [&_h3_*]:!text-[18px] [&_h3_*]:!font-bold [&_h3_*]:!text-black [&_h4]:!text-[16px] [&_h4]:!font-bold [&_h4]:!text-black [&_h4]:!mt-5 [&_h4]:!mb-2.5 [&_h4_*]:!text-[16px] [&_h4_*]:!font-bold [&_h4_*]:!text-black [&_p]:!text-black [&_p]:!leading-relaxed [&_p]:!text-[15px] [&_p]:!mb-4 [&_strong]:!text-black [&_strong_*]:!text-black [&_a]:!text-[var(--color-primary,#4c2691)] [&_a]:!underline hover:[&_a]:!text-[var(--color-primary-dark,#5c33a6)] [&_ul]:!list-disc [&_ul]:!pl-5 [&_ul]:!my-2 [&_ol]:!list-decimal [&_ol]:!pl-5 [&_ol]:!my-2 [&_li]:!my-1"
                        dangerouslySetInnerHTML={{
                          __html: blogs?.description || "Blog content loading..."
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="w-full lg:w-1/3 px-4 mt-8 lg:mt-0">
                  <div className="lg:sticky lg:top-6 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                      <div className="p-6">
                        <h5 className="text-lg font-bold text-gray-900 mb-4">Latest Blogs</h5>
                        <ul
                          className="space-y-4"
                          style={{
                            maxHeight: bloglist?.length > 6 ? "300px" : "auto",
                            overflowY:
                              bloglist?.length > 6 ? "auto" : "visible",
                            paddingRight: bloglist?.length > 6 ? "8px" : "0",
                          }}
                        >
                          {bloglist?.map((blog, index) => (
                            <li key={index} className="flex gap-4 items-center">
                              <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                <Link to={`/blog-details/${blog.slug}`}>
                                  <img
                                    className="w-full h-full object-cover"
                                    src={getImageUrl(blog.files?.[0])}
                                    alt={blog.title}
                                  />
                                </Link>
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <p className="text-xs text-gray-500">
                                  {new Date(blog.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </p>
                                <h4 className="!text-sm !font-semibold !text-gray-900 hover:text-blue-600 !line-clamp-2 !transition-colors">
                                  <Link to={`/blog-details/${blog.slug}`}>
                                    {blog.title}
                                  </Link>
                                </h4>
                                <h4>
                                  <Link
                                    to={`/blog-details/${blog.slug}`}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors mt-1"
                                  >
                                    {blog.category?.name}
                                  </Link>
                                </h4>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="absolute inset-0 overflow-hidden -z-10 invisible pointer-events-none">
                      <div className="absolute inset-0 overflow-hidden -z-10 invisible">
                        <div className="absolute left-0 top-0 transition-all w-[450px] h-[1138px]" />
                      </div>
                      <div className="absolute inset-0 overflow-hidden -z-10 invisible">
                        <div className="absolute left-0 top-0 transition-[0s] w-[200%] h-[200%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Home2Footer />
        </>
      )}
    </>
  );
};

export default BlogDetailsj;
