import React, { useEffect, useState } from "react";
import Home2Header from "../../../../components/home/Header-k";
import Home2Footer from "../../../../components/home/Footer-f";
import { Link, useParams } from "react-router-dom";
import { axiosInstance } from "../../../../Apiservice";
import toast from "react-hot-toast";
import { getImageUrl } from "../../../../utils";
import PageLoader from "../../../../components/ui/PageLoader.jsx";

const BlogDetailsj = () => {
  const { slug } = useParams();
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
      <style>
        {`
      @media (max-width: 991.98px) {
        .content {
          padding: 10px 0 16px;
        }

        .blog-image img {
          max-height: 360px;
        }
      }

      .blog-image {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fafafa;
        border-radius: 10px;
        overflow: hidden;
        min-height: 200px;
      }

      .blog-image img {
        width: 100%;
        height: auto;
        max-height: 480px;
        object-fit: contain;
        object-position: center;
      }
    `}
      </style>
      {loading ? (
        <PageLoader />
      ) : (
        <>
          <Home2Header />
          <div className="breadcrumb-bar">
            <div className="container">
              <div className="row align-items-center inner-banner">
                <div className="col-md-12 col-12 text-center">
                  <nav aria-label="breadcrumb" className="page-breadcrumb mb-3">
                    <ol className="breadcrumb align-items-center mb-2">
                      <li className="breadcrumb-item">
                        <Link
                          to="/"
                          className="text-decoration-none d-flex align-items-center gap-1"
                        >
                          <i className="isax isax-home-15"></i>
                          <span>Home</span>
                        </Link>
                      </li>

                      <li className="breadcrumb-item">
                        <Link className="text-decoration-none">Blog</Link>
                      </li>
                    </ol>

                    <h1 className="breadcrumb-title fw-semibold">
                      {blogs?.title}
                    </h1>
                  </nav>
                </div>
              </div>
            </div>
            <div className="breadcrumb-bg">
              <img
                src="/assets/img/bg/breadcrumb-bg-01.png"
                alt="img"
                className="breadcrumb-bg-01"
              />
              <img
                src="/assets/img/bg/breadcrumb-bg-02.png"
                alt="img"
                className="breadcrumb-bg-02"
              />
              <img
                src="/assets/img/bg/breadcrumb-icon.png"
                alt="img"
                className="breadcrumb-bg-03"
              />
              <img
                src="/assets/img/bg/breadcrumb-icon.png"
                alt="img"
                className="breadcrumb-bg-04"
              />
            </div>
          </div>
          <div className="content">
            <div className="container" style={{ transform: "none" }}>
              <div className="row" style={{ transform: "none" }}>
                <div className="col-lg-8 col-md-12">
                  <div className="blog-view">
                    <h5 className="mb-3">{blogs?.title || "Blog Title"}</h5>
                    <div className="blog blog-single-post">
                      <div className="blog-image">
                        <img
                          alt="blog-image"
                          src={getImageUrl(blogs?.files?.[0])}
                          className="img-fluid"
                        />
                      </div>
                      <div className="blog-info d-md-flex align-items-center justify-content-between flex-wrap">
                        <div className="post-left">
                          <ul>
                            <li>
                              <span className="badge badge-dark fs-14 fw-medium">
                                {blogs?.category?.name || "Health Tips"}
                              </span>
                            </li>
                            <li>
                              <i className="isax isax-calendar" />
                              {new Date(blogs?.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              ) || ""}
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="blog-content">
                        <p>
                          {countWords(blogs?.description) > 200 && !isExpanded
                            ? `${blogs?.description?.split(/\s+/).slice(0, 200).join(" ")}...`
                            : blogs?.description || "Blog content loading..."}
                        </p>
                        {countWords(blogs?.description) > 200 && (
                          <button
                            onClick={toggleExpanded}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#1e3a8a",
                              cursor: "pointer",
                              fontSize: "14px",
                              fontWeight: "600",
                              padding: "4px 0",
                              textDecoration: "underline",
                            }}
                          >
                            {isExpanded ? "View Less" : "View More"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="col-lg-4 col-md-12 sidebar-right theiaStickySidebar"
                  style={{
                    position: "relative",
                    overflow: "visible",
                    boxSizing: "border-box",
                    minHeight: 1,
                  }}
                >
                  <div
                    className="theiaStickySidebar"
                    style={{
                      paddingTop: 0,
                      paddingBottom: 1,
                      position: "static",
                      transform: "none",
                      top: 0,
                      left: "982.556px",
                    }}
                  >
                    <div className="card post-widget">
                      <div className="card-body">
                        <h5 className="mb-3">Latest Blogs</h5>
                        <ul
                          className="latest-posts"
                          style={{
                            maxHeight: bloglist?.length > 6 ? "300px" : "auto",
                            overflowY:
                              bloglist?.length > 6 ? "auto" : "visible",
                            paddingRight: bloglist?.length > 6 ? "8px" : "0",
                          }}
                        >
                          {bloglist?.map((blog, index) => (
                            <li key={index}>
                              <div className="post-thumb">
                                <Link to={`/blog-details/${blog.slug}`}>
                                  <img
                                    className="img-fluid"
                                    src={getImageUrl(blog.files?.[0])}
                                    alt={blog.title}
                                  />
                                </Link>
                              </div>
                              <div className="post-info">
                                <p>
                                  {new Date(blog.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </p>
                                <h4>
                                  <Link to={`/blog-details/${blog.slug}`}>
                                    {blog.title}
                                  </Link>
                                </h4>
                                <h4>
                                  <Link
                                    to={`/blog-details/${blog.slug}`}
                                    className="badge badge-light text-dark rounded"
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
                    <div
                      className="resize-sensor"
                      style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "hidden",
                        zIndex: -1,
                        visibility: "hidden",
                      }}
                    >
                      <div
                        className="resize-sensor-expand"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          right: 0,
                          bottom: 0,
                          overflow: "hidden",
                          zIndex: -1,
                          visibility: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            transition: "all",
                            width: 450,
                            height: 1138,
                          }}
                        />
                      </div>
                      <div
                        className="resize-sensor-shrink"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          right: 0,
                          bottom: 0,
                          overflow: "hidden",
                          zIndex: -1,
                          visibility: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            transition: "0s",
                            width: "200%",
                            height: "200%",
                          }}
                        />
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
