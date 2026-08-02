import Swal from "sweetalert2";

const ToastMixin = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

export const toast = {
  success: (msg) => {
    ToastMixin.fire({
      icon: "success",
      title: msg,
    });
  },
  error: (msg) => {
    ToastMixin.fire({
      icon: "error",
      title: msg,
    });
  }
};
