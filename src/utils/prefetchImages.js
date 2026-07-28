import { getImageUrl } from "./imageUrl";

const pushImagePath = (paths, value) => {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach((item) => pushImagePath(paths, item));
    return;
  }
  if (typeof value === "string" && value.trim()) {
    paths.push(value);
    return;
  }
  if (typeof value === "object") {
    pushImagePath(paths, value.url || value.path);
  }
};

export const collectHomeImagePaths = ({
  categories = [],
  topsalesproductvendor = [],
  sections = [],
  blogs = [],
  vendor = [],
} = {}) => {
  const paths = [];

  categories.forEach((category) => pushImagePath(paths, category.files));

  topsalesproductvendor.slice(0, 12).forEach((item) => {
    pushImagePath(
      paths,
      item?.tablet?.files ||
        item?.tabletdetails?.files ||
        item?.files ||
        item?.imageUrl,
    );
  });

  sections.forEach((section, sectionIndex) => {
    const limit = sectionIndex === 0 ? 8 : 4;
    (section.products || []).slice(0, limit).forEach((product) => {
      pushImagePath(
        paths,
        product?.files ||
          product?.productDetails?.files ||
          product?.imageUrl ||
          product?.tablet?.files,
      );
    });
  });

  blogs.slice(0, 4).forEach((blog) => pushImagePath(paths, blog.files?.[0]));

  const vendorParts = vendor?.[0];
  if (vendorParts) {
    [...(vendorParts.part1 || []), ...(vendorParts.part2 || [])].forEach(
      (item) => {
        pushImagePath(paths, item?.files || item?.image || item?.banner);
      },
    );
  }

  return paths;
};

export const prefetchImageUrls = (paths = [], limit = 28) => {
  const seen = new Set();

  paths.forEach((path) => {
    if (seen.size >= limit) return;

    const url = getImageUrl(path);
    if (!url || seen.has(url)) return;

    seen.add(url);
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  });
};

export const preloadStaticImages = (urls = []) => {
  urls.forEach((href) => {
    if (!href || document.querySelector(`link[rel="preload"][href="${href}"]`)) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = href;
    document.head.appendChild(link);
  });
};
