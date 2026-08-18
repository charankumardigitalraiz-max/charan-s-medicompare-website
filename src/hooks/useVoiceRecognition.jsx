import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import BaseModal from "../components/ui/BaseModal";

export const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [showMicPermission, setShowMicPermission] = useState(false);
  const [skipMicPermission, setSkipMicPermission] = useState(() => {
    return localStorage.getItem("medicompares_mic_permission") === "granted";
  });

  const recognitionRef = useRef(null);
  const onResultCallbackRef = useRef(null);

  const startListening = useCallback(async (onResult, isExplicitSkip = false) => {
    onResultCallbackRef.current = onResult;

    // Show custom modal if first time and not explicitly skipped
    if (!isExplicitSkip && !skipMicPermission) {
      setShowMicPermission(true);
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) { }
    }

    // Check permission state in browser
    let permissionState = "prompt";
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: "microphone" });
        permissionState = result.state;
      } catch (e) { }
    }

    if (permissionState === "denied") {
      toast("Please enable microphone in browser settings to use voice search", { icon: "🎙️" });
      return;
    }

    // If permission needs to be requested, trigger the native browser permission prompt safely
    if (permissionState === "prompt" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        // Only stop if the user explicitly blocked/denied it
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          return;
        }
      }
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Your browser does not support voice search");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const voiceText = event.results[0][0].transcript;
      if (onResult) {
        onResult(voiceText);
      }
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === "not-allowed") {
        // Suppress permission denied toast per user request
      } else if (event.error === "no-speech") {
        toast.error("No voice detected");
      } else {
        toast.error("Voice recognition failed");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      setIsListening(false);
    }
  }, [skipMicPermission]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) { }
      setIsListening(false);
    }
  }, []);

  const handleMicPermissionConfirm = useCallback((granted, skipFuture) => {
    setShowMicPermission(false);
    if (granted) {
      if (skipFuture) {
        setSkipMicPermission(true);
        localStorage.setItem("medicompares_mic_permission", "granted");
      }
      setTimeout(() => {
        startListening(onResultCallbackRef.current, true);
      }, 100);
    }
  }, [startListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) { }
      }
    };
  }, []);

  const showRef = useRef(showMicPermission);
  showRef.current = showMicPermission;

  const handleConfirmRef = useRef(handleMicPermissionConfirm);
  handleConfirmRef.current = handleMicPermissionConfirm;

  const setShowMicPermissionRef = useRef(setShowMicPermission);
  setShowMicPermissionRef.current = setShowMicPermission;

  const MicPermissionModal = useMemo(() => {
    return () => (
      <MicPermissionModalInner
        show={showRef.current}
        onClose={() => setShowMicPermissionRef.current(false)}
        onConfirm={handleConfirmRef.current}
      />
    );
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    MicPermissionModal,
  };
};

const MicPermissionModalInner = ({ show, onClose, onConfirm }) => {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (show) {
      setChecked(false);
    }
  }, [show]);

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title="Shop faster with voice"
      size="md"
      isBottomSheetOnMobile={true}
      zIndex={10001}
    >
      <div className="flex flex-col items-center">
        <div className="text-center mb-6">
          <i className="fa fa-microphone text-[48px] sm:text-[64px] text-sky-600 mb-4" />
        </div>

        <div className="w-full mb-6">
          <label className="flex items-start gap-3 cursor-pointer mb-4 select-none">
            <input
              type="checkbox"
              id="mic-skip-checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer mt-0.5"
            />
            <span className="text-sm text-slate-600 font-medium">
              Allow this Medicompares app to access your microphone and skip this step in the future.
            </span>
          </label>
          <p className="text-xs text-slate-500 mt-2">
            You can manage this access at any time in{" "}
            <span className="text-sky-600 underline cursor-pointer font-medium">
              permissions settings
            </span>
            .
          </p>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            Your audio is transcribed in the cloud then automatically deleted. We store and use the transcripts as described in our{" "}
            <span className="text-sky-600 underline cursor-pointer font-medium">
              Privacy Notice
            </span>
            .
          </p>
        </div>

        <div className="flex w-full gap-3 mt-4">
          <button
            onClick={() => onConfirm(false, false)}
            className="flex-1 py-3 px-4 !border !border-slate-200 hover:border-slate-300 !rounded-lg bg-white !text-slate-700 text-sm font-semibold cursor-pointer transition-colors active:scale-95"
          >
            Not now
          </button>
          <button
            onClick={() => {
              onConfirm(true, checked);
            }}
            className="flex-1 py-3 px-4 !rounded-lg bg-[#321961] hover:bg-[#432380] text-white text-sm font-semibold cursor-pointer transition-colors active:scale-95 border-none"
          >
            Turn on microphone
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
