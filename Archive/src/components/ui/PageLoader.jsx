export const PAGE_LOADER_IMAGE = "/MediCompares_Logo.png";

const PageLoader = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      width: "100vw",
    }}
  >
    <img src={PAGE_LOADER_IMAGE} alt="loaderLogo" width={200} height="auto" />
  </div>
);

export default PageLoader;
