export type LoginResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };
