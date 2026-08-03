import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useResponsive } from "../../../hooks/useResponsive";
import { FaCopy, FaShareAlt, FaCheck, FaUserPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { Table } from "../../../components/ui";

const Referral = ({ HomeNavigate, BackButton, profile }) => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [isCopied, setIsCopied] = useState(false);
  const [referralCode, setReferralCode] = useState("MEDI1234");
  const [referredUsers, setReferredUsers] = useState([]);

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        // const response = await api.get('/user/referral');
        // setReferralCode(response.data.referralCode);
        // setReferredUsers(response.data.referredUsers || []);
      } catch (error) {
        // Error fetching referral data
      }
    };
    fetchReferralData();
  }, []);

  const referralLink = `https://medicompares.com/login?ref=${profile?.refferalcode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        setIsCopied(true);
        toast.success('Referral link copied to clipboard!');
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        toast.error('Failed to copy link');
      });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join MedicalCompare with my referral',
          text: `Use my referral code ${profile?.refferalcode} to get special benefits on MedicalCompare!`,
          url: referralLink,
        });
      } catch (err) {
        // Error sharing
      }
    } else {
      handleCopyLink();
    }
  }
  const headers = [
    {
      key: "name",
      label: "Name"
    },
    {
      key: "date",
      label: "Date",
      render: (value) => value ? new Date(value).toLocaleDateString() : "-"
    },
    {
      key: "status",
      label: "Status",
      className: "text-right",
      render: (value) => (
        <span className={`px-2.5 py-1 rounded-[12px] text-[12px] font-medium ${value === 'Completed' ? 'bg-[#e6f7ee] text-[#10b981]' : 'bg-[#fff4e6] text-[#f59e0b]'}`}>
          {value}
        </span>
      )
    }
  ];

  return (
    <div className="!w-full">
      <div className="!py-4 md:!py-6">
        <div className="!max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8">
          <div className="!flex !flex-col !gap-5">
            {BackButton && (
              <div className="col-12 mb-3">
                <BackButton />
              </div>
            )}

            {/* Header Section */}
            <div className="!w-full">
              <div className="!flex !flex-col sm:!flex-row !justify-between !items-start sm:!items-center !gap-3 !pb-3 !mb-2 !border-b !border-slate-100 !mt-2">
                <div className="!flex !items-center !gap-3.5">
                  {HomeNavigate && <HomeNavigate />}
                  <div className="!w-11 !h-11 !rounded-xl !bg-purple-50 !text-[#321961] !flex !items-center !justify-center !text-[20px] !shrink-0 !border !border-purple-100/50 !shadow-sm">
                    <i className="fa-solid fa-user-plus" />
                  </div>

                  <div className="!flex !flex-col !gap-1">
                    <div className="!m-0 !text-[#0f172a] !font-medium !text-[16px] md:!text-[16px] !tracking-tight !leading-none" >
                      Refer & Earn
                    </div>
                    <div className="!text-slate-500 !text-[12px] !m-0 !font-medium !leading-none">
                      Invite friends and earn rewards for each referral
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Card */}
            <div className="!bg-gradient-to-br !from-[#321961] !to-[#5a0fd6] !text-white !rounded-[9px] !p-6 !text-center !shadow-md">
              <FaUserPlus size={40} className="!mb-4 !inline-block" />
              <h3 className="!text-white !m-0 !mb-2.5 !text-xl !font-bold">Invite Friends & Earn Rewards</h3>
              <p className="!text-white !m-0 !mb-5 !opacity-90 !text-sm">
                Share your referral code and earn ₹100 for every friend who signs up
              </p>

              <div className="!bg-white/15 !p-4 !rounded-lg !mb-4">
                <p className="!m-0 !mb-2.5 !text-xs !text-white !font-medium !uppercase !tracking-wider">Your Referral Code</p>
                <div className="!flex !justify-center !items-center !gap-3">
                  <div className="!bg-white !text-[#321961] !py-2 !px-4 !rounded-md !font-bold !text-lg !tracking-wider !shadow-sm">
                    {profile?.refferalcode}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="!bg-white !text-[#321961] !border-0 !py-2.5 !px-4 !rounded-md !font-bold !cursor-pointer !flex !items-center !gap-1.5 !shadow-sm !transition-all !duration-200 hover:!bg-purple-50"
                  >
                    {isCopied ? <FaCheck /> : <FaCopy />}
                    {isCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <button
                onClick={handleShare}
                className="!bg-white !text-[#321961] !border-0 !py-3 !px-6 !rounded-[30px] !font-bold !cursor-pointer !inline-flex !items-center !gap-2 !text-sm !shadow-md !transition-all !duration-300 hover:!-translate-y-0.5 hover:!shadow-lg"
              >
                <FaShareAlt /> Share Referral Link
              </button>
            </div>

            {/* How It Works Section */}
            <div className="!bg-white !rounded-[9px] !border !border-slate-200/80 !p-6 !shadow-[0_2px_10px_rgba(15,23,42,0.02)]">
              <h4 className="!mt-0 !mb-4 !text-slate-800 !font-bold !text-[15px] !uppercase !tracking-wider">How It Works</h4>
              <div className="!flex !flex-col !gap-4">
                {[
                  {
                    step: "1",
                    title: "Share Your Link",
                    description: "Share your referral link with friends and family"
                  },
                  {
                    step: "2",
                    title: "They Sign Up",
                    description: "Your friends sign up using your referral link"
                  },
                  {
                    step: "3",
                    title: "You Earn Rewards",
                    description: "Earn ₹100 for every successful referral"
                  }
                ].map((item, index) => (
                  <div key={index} className="!flex !gap-4 !items-start">
                    <div className="!bg-purple-50 !text-[#321961] !w-8 !h-8 !rounded-full !flex !items-center !justify-center !shrink-0 !font-bold !text-sm !border !border-purple-100/50">
                      {item.step}
                    </div>
                    <div>
                      <h5 className="!m-0 !mb-1 !text-slate-800 !font-semibold !text-[14px]">{item.title}</h5>
                      <p className="!m-0 !text-slate-500 !text-[13px]">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral History */}
            {referredUsers.length > 0 && (
              <div className="!bg-white !rounded-[9px] !border !border-slate-200/80 !p-6 !shadow-[0_2px_10px_rgba(15,23,42,0.02)]">
                <h4 className="!mt-0 !mb-4 !text-slate-800 !font-bold !text-[15px] !uppercase !tracking-wider">Your Referrals</h4>
                <Table
                  headers={headers}
                  data={referredUsers}
                  emptyMessage="No referrals found."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referral;