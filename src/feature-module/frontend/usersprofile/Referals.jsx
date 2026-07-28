import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useResponsive } from "../../../hooks/useResponsive";
import { FaCopy, FaShareAlt, FaCheck, FaUserPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";

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
  };

  return (
    <div className={`max-w-[800px] mx-auto p-[20px] ${isMobile ? 'p-[15px]' : ''}`}>
      {/* Header Section */}
      <div className="bg-white rounded-xl mb-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] w-full overflow-visible p-[25px] max-sm:px-[15px] max-sm:py-[20px]">
        <div className="flex w-full mb-3">
          <HomeNavigate />
        </div>
        <div className="flex flex-row max-sm:flex-col justify-between items-center max-sm:items-start gap-6 max-sm:gap-4 w-full">
          <div className="flex-1 min-w-0 max-w-full break-words overflow-hidden">
            <h3 className="text-[24px] max-sm:text-[20px] font-semibold text-[#333] m-0 flex items-center gap-2.5 flex-nowrap max-sm:flex-wrap">
              <i className="fa-solid fa-user-plus text-[#8059ca] shrink-0"></i>
              <span className="whitespace-nowrap max-sm:whitespace-normal overflow-hidden text-ellipsis block flex-1 min-w-0">
                Refer & Earn
              </span>
            </h3>
            <p className="text-[#666] text-sm max-sm:text-[13px] mt-1.25 mb-0 whitespace-nowrap max-sm:whitespace-normal overflow-hidden text-ellipsis max-w-full">
              Invite friends and earn rewards for each successful referral
            </p>
          </div>
        </div>
      </div>

      {/* Referral Card */}
      <div className="bg-gradient-to-br from-[#8059ca] to-[#5a0fd6] text-white rounded-xl p-5 mb-5 text-center">
        <FaUserPlus size={40} className="mb-3.75 inline-block" />
        <h3 className="text-white m-0 mb-2.5 text-xl font-bold">Invite Friends & Earn Rewards</h3>
        <p className="text-white m-0 mb-5 opacity-90">
          Share your referral code and earn ₹100 for every friend who signs up
        </p>

        <div className="bg-white/15 p-3.75 rounded-lg mb-3.75">
          <p className="m-0 mb-2.5 text-sm text-white">Your Referral Code</p>
          <div className="flex justify-center items-center gap-2.5">
            <div className="bg-white text-[#8059ca] py-2 px-3.75 rounded-md font-bold text-lg tracking-wider">
              {profile?.refferalcode}
            </div>
            <button
              onClick={handleCopyLink}
              className="bg-white text-[#8059ca] border-0 py-2 px-3.75 rounded-md font-semibold cursor-pointer flex items-center gap-1.25"
            >
              {isCopied ? <FaCheck /> : <FaCopy />}
              {isCopied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <button
          onClick={handleShare}
          className="bg-white text-[#8059ca] border-0 py-3 px-6 rounded-[30px] font-semibold cursor-pointer inline-flex items-center gap-2 text-base shadow-[0_4px_15px_rgba(0,0,0,0.1)] transition-all duration-300 ease hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]"
        >
          <FaShareAlt /> Share Referral Link
        </button>
      </div>

      {/* How It Works Section */}
      <div className="bg-white rounded-xl p-5 mb-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        <h4 className="mt-0 mb-3.75 text-[#2c3e50] font-semibold text-lg">How It Works</h4>
        <div className="flex flex-col gap-3.75">
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
            <div key={index} className="flex gap-3.75 items-start">
              <div className="bg-[#f0f0ff] text-[#8059ca] w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-sm">
                {item.step}
              </div>
              <div>
                <h5 className="m-0 mb-1.25 text-base font-semibold">{item.title}</h5>
                <p className="m-0 text-[#666] text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral History */}
      {referredUsers.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
          <h4 className="mt-0 mb-3.75 text-[#2c3e50] font-semibold text-lg">Your Referrals</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#eee]">
                  <th className="text-left p-2.5 text-[#666] font-normal">Name</th>
                  <th className="text-left p-2.5 text-[#666] font-normal">Date</th>
                  <th className="text-right p-2.5 text-[#666] font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {referredUsers.map((user, index) => (
                  <tr key={index} className="border-b border-[#f5f5f5]">
                    <td className="p-2.5 py-3 text-left">{user.name}</td>
                    <td className="p-2.5 py-3 text-left">{new Date(user.date).toLocaleDateString()}</td>
                    <td className="p-2.5 py-3 text-right">
                      <span className={`px-2.5 py-1 rounded-[12px] text-[12px] font-medium ${
                        user.status === 'Completed' ? 'bg-[#e6f7ee] text-[#10b981]' : 'bg-[#fff4e6] text-[#f59e0b]'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Referral;