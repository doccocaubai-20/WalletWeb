export const parseApiErrorMessage = (error, fallbackMessage = 'Có lỗi xảy ra. Vui lòng thử lại.') => {
  if (typeof error?.response?.data === 'string' && error.response.data.trim()) {
    return error.response.data;
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.data?.details && typeof error.response.data.details === 'object') {
    const firstDetail = Object.values(error.response.data.details).find(
      (value) => typeof value === 'string' && value.trim()
    );
    if (firstDetail) {
      return firstDetail;
    }
  }

  if (error?.response?.data && typeof error.response.data === 'object') {
    const firstObjectValue = Object.values(error.response.data).find(
      (value) => typeof value === 'string' && value.trim()
    );
    if (firstObjectValue) {
      return firstObjectValue;
    }
  }

  if (error?.message) {
    return error.message;
  }

  return fallbackMessage;
};
