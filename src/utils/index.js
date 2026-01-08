export const createPageUrl = (page) => {
  if (page === 'Home') return '/';
  if (page === 'Setup') return '/setup';
  return '/';
};
