const UserPreferenceThemeValues = ["dark", "light", "blue"] as const;
const UserPreferenceLanguageValues = ["en", "es", "fr"] as const;

type UserPreferenceTheme = (typeof UserPreferenceThemeValues)[number];
type UserPreferenceLanguage = (typeof UserPreferenceLanguageValues)[number];

export function isUserPreferenceTheme(
  theme: string,
): theme is UserPreferenceTheme {
  return UserPreferenceThemeValues.includes(theme as UserPreferenceTheme);
}

export function isUserPreferenceLanguage(
  language: string,
): language is UserPreferenceLanguage {
  return UserPreferenceLanguageValues.includes(
    language as UserPreferenceLanguage,
  );
}

export class UserPreferences {
  constructor(
    public theme: UserPreferenceTheme,
    public language: UserPreferenceLanguage,
    public notifications: boolean,
  ) {}
}
