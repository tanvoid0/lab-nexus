export type ThemePreference = "light" | "dark" | "system";

export type DensityPreference = "comfortable" | "compact";

export type UserSettingsPublic = {
  theme: ThemePreference;
  density: DensityPreference;
};
