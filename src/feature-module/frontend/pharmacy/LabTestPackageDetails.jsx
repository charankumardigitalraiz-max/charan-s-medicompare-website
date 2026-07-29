import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { axiosCommonInstance } from "../../../Apiservice.jsx";
import { getImageUrl } from "../../../utils/index";
import Home2Header from "../../../components/home/Header-k";
import Footer from "../../../components/home/Footer-f";
import { useResponsive } from "../../../hooks";
import VendorActions from "../../../components/ui/VendorActions.jsx";
import { handleGeneralBookingProcess } from "../../../services/bookingService";

const formatCurrency = (v) =>
  `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

const calcDiscount = (price, discountprice) => {
  if (!discountprice || discountprice <= 0 || discountprice >= price) return 0;
  return Math.round(((price - discountprice) / price) * 100);
};

const TestAccordionRow = ({ test, index }) => {
  const [open, setOpen] = useState(false);
  const hasParams = test.parameterss?.length > 0;

  return (
    <div className="border border-[#ede9f8] rounded-[10px] mb-2 overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => hasParams && setOpen((p) => !p)}
        className={`w-full flex items-center justify-between px-[18px] py-[14px] bg-transparent border-none text-left gap-3 ${hasParams ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8059ca] to-[#a875f7] text-white flex items-center justify-center text-[12px] font-bold flex-shrink-0">
            {index + 1}
          </div>
          <div>
            <span className="text-[14px] font-semibold text-[#222] block">{test.name}</span>
          </div>
          {hasParams && (
            <span className="text-[11px] text-[#8059ca] bg-[#f3eeff] rounded-[10px] px-2 py-[2px] whitespace-nowrap font-medium">
              {test.parameterss.length} Parameter{test.parameterss.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {hasParams && (
          <i className={`fas fa-chevron-${open ? "up" : "down"} text-[#8059ca] text-[12px] flex-shrink-0`} />
        )}
      </button>

      {open && hasParams && (
        <div className="border-t border-[#f0ebff] bg-[#faf8ff] px-[18px] pt-3 pb-4 pl-[58px]">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="text-[#888] border-b-[1.5px] border-[#ede9f8]">
                <th className="py-1 pr-2 text-left font-semibold">Parameter Name</th>
                <th className="py-1 px-2 text-left font-semibold">Reference Range</th>
                <th className="py-1 pl-2 text-left font-semibold">Units</th>
              </tr>
            </thead>
            <tbody>
              {test.parameterss.map((p) => (
                <tr key={p._id} className="border-b border-[#ede9f8]">
                  <td className="py-2 pr-2 text-[#333] font-medium">{p.name}</td>
                  <td className="py-2 px-2 text-[#555]">{p.normalRange || "—"}</td>
                  <td className="py-2 pl-2 text-[#777]">{p.units || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const LabTestPackageDetails = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useResponsive();

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idToFetch = packageId || location.state?.packageId;
    if (!idToFetch) {
      toast.error("Package not found");
      navigate(-1);
      return;
    }
    fetchPackage(idToFetch);
  }, [packageId]);

  const fetchPackage = async (id) => {
    try {
      setLoading(true);
      const res = await axiosCommonInstance.get(`packages/single/${id}`);
      setPkg(res.data?.data?.list || null);
    } catch (err) {
      toast.error("Failed to load package details");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (vendor, med, effectiveVariantId, price, stock, path) => {
    await handleGeneralBookingProcess({
      productId: med?._id || med?.id || med?.name,
      variantId: effectiveVariantId || null,
      vendorId: vendor?.vendorId || vendor?._id || vendor?.businessDetails?._id,
      servicefixedTypes: pkg?.categories?.fixedType || "labtests",
      packageId: med?._id || null,
      navigate,
      redirectPath: path || "/booking-process",
    });
  };

  const price = parseFloat(pkg?.price) || 0;
  const discountprice = parseFloat(pkg?.discountprice) || 0;
  const effectivePrice = discountprice > 0 && discountprice < price ? discountprice : price;
  const discount = calcDiscount(price, discountprice);
  const savings = price - effectivePrice;
  const vendorBiz = pkg?.vendor?.businessDetails;

  if (loading) {
    return (
      <div className="main-wrapper">
        <Home2Header />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#f0ebff] border-t-[#8059ca] animate-spin" />
          <p className="text-[#8059ca] font-medium">Loading package…</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!pkg) return null;

  const tablets = pkg.tablets || [];
  const totalParams = tablets.reduce((s, t) => s + (t.parameterss?.length || 0), 0);

  return (
    <div className="main-wrapper">
      <Home2Header />

      <div className="max-w-[1440px] mx-auto px-4 py-6 md:py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-[#8059ca] border border-[#e9d5ff] rounded-[30px] px-4 py-1.5 no-underline text-[12px] font-semibold bg-[#fdfaff] transition-all duration-200 hover:text-white hover:bg-gradient-to-r hover:from-[#8059ca] hover:to-[#6f42c1] hover:border-[#8059ca] hover:shadow-[0_4px_12px_rgba(128,89,202,0.2)] shadow-[0_2px_5px_rgba(128,89,202,0.05)] mb-4"
        >
          <i className="fas fa-arrow-left" /> Back
        </button>

        <div className="row">
          {/* Left: Details */}
          <div className="col-lg-8">
            {/* Package Hero Card */}
            <div className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(128,89,202,0.06)] border border-[#ede9f8] p-5 mb-5 overflow-hidden">
              <div className="flex items-center gap-4 flex-wrap mb-4">
                <img
                  src={pkg.files?.[0] ? getImageUrl(pkg.files[0]) : "/assets/default.png"}
                  alt={pkg.name}
                  className="w-[100px] h-[100px] object-contain rounded-lg bg-[#f8f6ff] p-2 flex-shrink-0 border border-[#f0ebff]"
                  onError={(e) => { e.target.src = "/assets/default.png"; }}
                />
                <div className="flex-1 min-w-[250px]">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="bg-[#f0ebff] text-[#8059ca] text-[10px] font-semibold px-2 py-[2px] rounded-full">
                      Lab Test Package
                    </span>
                    {discount > 0 && (
                      <span className="bg-[#dcfce7] text-[#16a34a] text-[10px] font-semibold px-2 py-[2px] rounded-full">
                        {discount}% OFF
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl md:text-2xl !font-bold text-[#1a1a2e] mb-2 capitalize">
                    {pkg.name}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl md:text-2xl !font-bold text-[#8059ca]">
                      {formatCurrency(effectivePrice)}
                    </span>
                    {discount > 0 && (
                      <span className="text-[13px] text-[#aaa] line-through">{formatCurrency(price)}</span>
                    )}
                    {savings > 0 && (
                      <span className="text-[12px] text-[#16a34a] font-semibold">Save {formatCurrency(savings)}</span>
                    )}
                  </div>
                </div>
              </div>

              {pkg.subcategories?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {pkg.subcategories.map((sub) => (
                    <span
                      key={sub._id}
                      className="text-[11px] text-[#666] bg-[#f5f5f5] border border-[#e5e5e5] px-[10px] py-[3px] rounded-[30px] font-medium"
                    >
                      <i className="fas fa-tags mr-1 text-[#8059ca]" />
                      {sub.name}
                    </span>
                  ))}
                </div>
              )}

              <hr className="border-[#ede9f8] mb-4" />

              {/* Stats row */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: "fa-vial", label: "Tests Included", value: `${tablets.length} Tests` },
                  { icon: "fa-flask", label: "Parameters", value: `${totalParams}` },
                ].map((stat, i) => (
                  <div key={i} className="flex-[1_1_120px] flex items-center gap-3 p-[10px] rounded-lg bg-[#faf8ff] border border-[#f0ebff]">
                    <div className="w-8 h-8 rounded-md bg-[#f0ebff] flex items-center justify-center text-[#8059ca] text-[13px] flex-shrink-0">
                      <i className={`fas ${stat.icon}`} />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#888] block">{stat.label}</span>
                      <span className="text-[12px] font-semibold text-[#1a1a2e]">{stat.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {pkg.description && (
                <div className="mt-5 pt-4 border-t border-[#ede9f8]">
                  <h3 className="text-[14px] font-semibold text-[#1a1a2e] mb-2">Description</h3>
                  <p className="text-[12px] text-[#555] leading-relaxed m-0">{pkg.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Sticky Booking Panel */}
          <div className="col-lg-4">
            <div className={`flex flex-col gap-4 ${isMobile ? "" : "sticky top-[80px]"}`}>
              {/* Price + CTA Card */}
              <div className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(128,89,202,0.08)] border border-[#ede9f8] p-5 overflow-hidden">
                <p className="text-[#888] text-[11px] mb-[2px] font-semibold uppercase tracking-wide">Package Price</p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-[20px] font-semibold text-[#1a1a2e]">{formatCurrency(effectivePrice)}</span>
                  {discount > 0 && (
                    <span className="text-[13px] text-[#aaa] line-through">{formatCurrency(price)}</span>
                  )}
                </div>
                {discount > 0 && (
                  <span className="inline-block mb-4 bg-[#fef3c7] text-[#d97706] text-[11px] font-semibold px-2 py-[2px] rounded-[20px]">
                    {discount}% OFF · Save {formatCurrency(savings)}
                  </span>
                )}
                <div className="w-full">
                  <VendorActions
                    bookingType={pkg?.categories?.categoryType || "cartslots"}
                    IsPackage={true}
                    med={pkg}
                    vendor={pkg?.vendor || {}}
                    price={price}
                    calculatedDiscountPrice={discountprice > 0 ? discountprice : null}
                    stock={pkg?.stock || 999}
                    service={pkg?.categories?.fixedType || "labtests"}
                    handleRentalBookinProcess=""
                    handleNavigateToBooking={handleBooking}
                    handleAddLead=""
                    handleOpenConsultationModal=""
                    handleOpenAppointmentModal=""
                    handleOpenRideModal=""
                    className="w-100"
                    containerStyle={{ display: "flex", flexDirection: "column", width: "100%", gap: "8px" }}
                  />
                </div>
              </div>

              {/* Vendor Card */}
              {pkg.vendor && (
                <div className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(128,89,202,0.06)] border border-[#ede9f8] p-4">
                  <div className="text-[11px] font-semibold text-[#888] uppercase tracking-[0.5px] mb-3">
                    Provided By Lab
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src={vendorBiz?.bussiness_image?.url ? getImageUrl(vendorBiz.bussiness_image.url) : "/assets/default.png"}
                      alt={vendorBiz?.name || "Vendor"}
                      className="w-11 h-11 rounded-lg object-cover border border-[#ede9f8] flex-shrink-0"
                      onError={(e) => { e.target.src = "/assets/default.png"; }}
                    />
                    <div>
                      <p className="text-[13px] font-semibold text-[#1a1a2e] mb-[2px]">
                        {vendorBiz?.name || `${pkg.vendor.firstName} ${pkg.vendor.lastName}`}
                      </p>
                      {vendorBiz?.address && (
                        <p className="text-[11px] text-[#777] m-0 flex items-start gap-1">
                          <i className="fas fa-map-marker-alt text-[#8059ca] mt-[2px] flex-shrink-0" />
                          {vendorBiz.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tests Included (Full Width) */}
        {tablets.length > 0 && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(128,89,202,0.06)] border border-[#ede9f8] mb-5 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-[14px] border-b border-[#f3eeff]">
                  <h3 className="text-[13px] font-semibold text-[#1a1a2e] m-0 flex items-center gap-2">
                    <i className="fas fa-vial text-[#8059ca]" />
                    Tests Included ({tablets.length})
                  </h3>
                </div>
                <div className="p-4">
                  {tablets.map((test, i) => (
                    <TestAccordionRow key={test._id} test={test} index={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default LabTestPackageDetails;
