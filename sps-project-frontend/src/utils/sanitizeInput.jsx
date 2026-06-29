export const sanitizeInput = (val = "") => {
    const newVal = val.toLowerCase().trim();
    return newVal
  }