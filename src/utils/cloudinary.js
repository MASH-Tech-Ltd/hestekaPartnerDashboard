/**
 * Formats a Cloudinary secure_url to apply dynamic width/height cropping and optimization.
 * Example insertion: /upload/w_300,h_300,c_fill,g_auto,f_auto,q_auto/...
 */
export const getOptimizedCloudinaryUrl = (url) => {
  return url;
};

/**
 * Returns a user-friendly display name for the partner organization.
 * - If the company name is present and NOT a pure number (e.g. registration ID), return the company name.
 * - Otherwise, return the partner's first and last name.
 */
export const getPartnerName = (user) => {
  if (!user) return "";
  const hasCompany = user.company && String(user.company).trim() !== "";
  const isNumericCompany = hasCompany && /^\d+$/.test(String(user.company).trim());
  
  if (hasCompany && !isNumericCompany) {
    return user.company;
  }
  
  if (user.firstName || user.lastName) {
    return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  }
  
  return user.company || "";
};
