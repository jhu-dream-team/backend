const MODULES = {};

export const lazyModule = async modulePath => {
  if (!MODULES[modulePath]) {
    MODULES[modulePath] = await import(modulePath);
  }

  return MODULES[modulePath];
};
