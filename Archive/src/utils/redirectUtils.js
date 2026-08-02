export const storeRedirectUrl = (from) => {
  try {
    localStorage.setItem('redirectAfterLogin', from);
  } catch (error) {
  }
};

export const getRedirectUrl = () => {
  try {
    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    return redirectUrl;
  } catch (error) {
    return null;
  }
};

export const clearRedirectUrl = () => {
  try {
    localStorage.removeItem('redirectAfterLogin');
  } catch (error) {
  }
};

export const navigateToLogin = (navigate, currentPath = null) => {
  const from = currentPath || window.location.pathname;
  storeRedirectUrl(from);
  navigate('/login');
};

export const handlePostLoginRedirect = (navigate, defaultPath = '/') => {
  const redirectUrl = getRedirectUrl();
  clearRedirectUrl();
  
  if (redirectUrl && redirectUrl !== '/login' && redirectUrl !== '/email-otp') {
    navigate(redirectUrl);
  } else {
    navigate(defaultPath);
  }
};
