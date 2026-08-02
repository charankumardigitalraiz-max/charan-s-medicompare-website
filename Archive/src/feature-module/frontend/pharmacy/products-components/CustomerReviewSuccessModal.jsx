import React, { useState } from "react";
import BaseModal from "../../../../components/ui/BaseModal";

const CustomerReviewsSuccessModal = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="text-center mt-20">
        <button
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-all duration-200 cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          Open Review Modal
        </button>
      </div>

      <BaseModal
        show={showModal}
        onClose={() => setShowModal(false)}
        title="Product Ratings & Reviews"
        size="lg"
        bodyClassName="!p-4"
        headerClassName="border-none pb-0"
      >
        <div className="text-sm text-gray-400 mt-[-10px] mb-4">
          Your feedback helps others make informed decisions
        </div>

        <div className="flex flex-col gap-2">
          <div className="w-full">
            <div className="bg-[#fcfcfc] rounded-xl p-3 mb-2.5 border border-[#e9e6e6] shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:border-gray-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between h-full">
              <div className="mb-2">
                <div className="flex items-start gap-3">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/2966/2966327.png"
                    alt="Dextromethorphan"
                    className="w-10 h-10 rounded-lg border border-gray-300 object-contain"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 mb-[3px] truncate">
                      Dextromethorphan
                    </div>
                    <div className="text-amber-400 text-sm mt-1 flex gap-0.5">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="far fa-star text-gray-300"></i>
                      <i className="far fa-star text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <textarea
                  className="w-full rounded-lg border border-gray-200 text-sm p-2.5 resize-none bg-gray-50 outline-none focus:border-purple-500 focus:bg-white transition-all duration-200"
                  rows="2"
                  placeholder="Share your experience..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <button className="w-full bg-gradient-to-r from-[#7b3fe4] to-[#9b5cff] hover:opacity-90 text-white font-semibold text-lg py-2.5 px-4 rounded-lg border-none mt-4 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg">
          Submit
        </button>
      </BaseModal>
    </>
  );
};

export default CustomerReviewsSuccessModal;
