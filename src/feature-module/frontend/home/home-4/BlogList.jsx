import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Home2Header from "../../../../components/home/Header-k.jsx";
import Home2Footer from "../../../../components/home/Footer-f";
import { axiosInstance } from "../../../../Apiservice";
import { getImageUrl } from "../../../../utils";
import PageLoader from "../../../../components/ui/PageLoader.jsx";
import Pagination from "../../../../components/ui/Pagination.jsx";
import { BackButton } from "../../../../components/ui/index.js";
import { useResponsive } from "../../../../hooks/index.js"
const BlogList = () => {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const { isTabletOrBelow } = useResponsive();
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

    const fetchBlogs = async (currentPage = 1) => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(`blog/list?page=${currentPage}&limit=9`);
            setBlogs(response?.data?.data?.list || []);
            setPagination(response?.data?.data?.pagination || { total: 0, totalPages: 1 });
        } catch (error) {
            console.error("Error fetching blogs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs(page);
    }, [page]);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const categories = [
        "All",
        ...Array.from(new Set(blogs.map((b) => b.category?.name).filter(Boolean))),
    ];

    const filteredBlogs = blogs.filter((blog) => {
        const matchesSearch =
            blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            blog.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
            activeCategory === "All" || blog.category?.name === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const handleBlogClick = (blog) => {
        navigate(`/blog-details/${blog.slug}`);
    };

    const truncate = (text, limit = 130) => {
        const plain = (text || "").replace(/<[^>]*>/g, "").trim();
        return plain.length > limit ? plain.slice(0, limit) + "..." : plain;
    };


    return (
        <>
            {loading ? (
                <PageLoader />
            ) : (
                <div className="min-h-screen bg-violet-50/50">
                    <Home2Header />

                    {/* Hero Banner */}
                    <div
                        className="relative overflow-hidden text-center bg-gradient-to-br from-[#321961] via-[#6d48b8] to-[#5a3a99] py-16 px-4"
                    // style={{ marginTop: isTabletOrBelow ? "70px" : "40px" }}
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-10"
                            style={{ backgroundImage: "url('/assets/Medicompares Background.png')" }}
                        ></div>
                        <div className="absolute top-4 left-4 z-20">
                            <BackButton className="!rounded-full !bg-white/90 border border-[#321961]/30 !text-[#321961] hover:!bg-[#321961] hover:!text-white shadow-sm" />
                        </div>
                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">
                                Insights &amp; Health Tips
                            </h1>
                            <p className="text-sm md:text-base text-white/80 leading-relaxed font-medium">
                                Stay informed with expert articles on medicine pricing,
                                alternatives, and smart healthcare decisions.
                            </p>
                        </div>
                    </div>

                    {/* Category Pills */}
                    <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8">
                        <div className="flex flex-wrap gap-2 justify-center">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    className={`px-4 py-1.5 !rounded-full !text-xs md:text-sm !font-semibold !transition-all !duration-200 !cursor-pointer !border ${activeCategory === cat
                                        ? "!bg-[#321961] !border-[#321961] !text-white !shadow-md !shadow-[#321961]/20"
                                        : "!bg-white !border-[#321961]/35 !text-[#321961] !hover:bg-[#321961] !hover:text-white !hover:border-[#321961]"
                                        }`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Count */}
                        <div className="text-[13px] text-slate-400 font-semibold mt-6 mb-2">
                            Showing {filteredBlogs.length} blog{filteredBlogs.length !== 1 ? "s" : ""}
                            {activeCategory !== "All" && (
                                <span> in <strong className="text-[#321961]">{activeCategory}</strong></span>
                            )}
                        </div>
                    </div>

                    {/* Blog Cards Grid */}
                    <div className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
                        {filteredBlogs.length === 0 ? (
                            <div className="text-center py-16 px-4">
                                <i className="fas fa-newspaper text-4xl text-violet-200 mb-3 block" />
                                <h5 className="text-slate-500 font-bold text-lg">No blogs found</h5>
                                <p className="text-slate-400 text-sm mt-1">
                                    Try a different keyword or category.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredBlogs.map((blog, index) => (
                                    <div
                                        key={blog._id || index}
                                        className="group bg-white rounded-2xl overflow-hidden border border-[#321961]/10 shadow-[0_4px_16px_rgba(128,89,202,0.05)] hover:shadow-[0_12px_32px_rgba(128,89,202,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
                                        onClick={() => handleBlogClick(blog)}
                                    >
                                        {/* Image */}
                                        <div className="w-full h-48 bg-violet-50/50 overflow-hidden flex items-center justify-center relative">
                                            <img
                                                src={
                                                    blog.files?.[0]
                                                        ? blog.files[0].startsWith("http")
                                                            ? blog.files[0]
                                                            : getImageUrl(blog.files[0])
                                                        : "/assets/default.png"
                                                }
                                                alt={blog.title}
                                                loading={index < 3 ? "eager" : "lazy"}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => {
                                                    e.target.src = "/assets/default.png";
                                                }}
                                            />
                                            {blog.category?.name && (
                                                <span className="absolute top-3 left-3 bg-[#321961]/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                    {blog.category.name}
                                                </span>
                                            )}
                                        </div>

                                        {/* Body */}
                                        <div className="p-5 flex-1 flex flex-col gap-2">
                                            <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                                                <i className="fas fa-calendar-alt" />
                                                {blog.createdAt
                                                    ? new Date(blog.createdAt).toLocaleDateString("en-US", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                    })
                                                    : ""}
                                            </div>
                                            <h3 className="!text-base !font-bold !text-slate-800 line-clamp-2 leading-snug">
                                                {blog.title}
                                            </h3>
                                            <div
                                                className="text-xs !text-slate-500 leading-relaxed flex-1 line-clamp-3"
                                                dangerouslySetInnerHTML={{ __html: truncate(blog.description, 130) }}
                                            />
                                            <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-2">
                                                <span className="text-xs font-bold text-[#321961] flex items-center gap-1 group-hover:gap-2 transition-all">
                                                    Read more <i className="fas fa-arrow-right text-[10px]" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="mt-8 mb-4">
                            <Pagination
                                page={page}
                                totalPages={pagination.totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}

                    <Home2Footer />
                </div>
            )}
        </>
    );
};

export default BlogList;


