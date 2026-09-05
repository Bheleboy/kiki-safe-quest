import type { LessonConfig } from "../types";

import internetSafety101 from "./ages-10-13_internet-safety-101.json";
import fiveWaysToStayPrivate from "./ages-10-13_5-ways-to-stay-private.json";
import beKindOnline from "./ages-10-13_be-kind-online.json";
import being_a_good_digital_friend from "./ages-10-13_being-a-good-digital-friend.json";
import catfish_and_fake_profiles from "./ages-10-13_catfish-and-fake-profiles.json";
import cookies_and_tracking from "./ages-10-13_cookies-and-tracking.json";
import creating_strong_passwords from "./ages-10-13_creating-strong-passwords.json";
import cb_building_positive from "./ages-10-13_cyber-bullying-and-respect-building-a-positive-online-community.json";
import cb_block_report from "./ages-10-13_cyber-bullying-and-respect-how-to-block-and-report.json";
import cb_standing_up from "./ages-10-13_cyber-bullying-and-respect-standing-up-for-others.json";
import cb_impact_words from "./ages-10-13_cyber-bullying-and-respect-the-impact-of-words.json";
import cb_what_is from "./ages-10-13_cyber-bullying-and-respect-what-is-cyberbullying.json";
import digital_footprint from "./ages-10-13_digital-footprint.json";
import location_sharing from "./ages-10-13_location-sharing.json";
import managing_reputation from "./ages-10-13_managing-your-online-reputation.json";
import mean_messages from "./ages-10-13_mean-messages.json";
import online_vs_offline from "./ages-10-13_online-vs-offline.json";
import privacy_settings from "./ages-10-13_privacy-settings-on-apps.json";
import scams_fake_websites from "./ages-10-13_scams-and-phishing-fake-websites.json";
import scams_in_game from "./ages-10-13_scams-and-phishing-in-game.json";
import scams_social_media from "./ages-10-13_scams-and-phishing-social-media-scams.json";
import scams_if_scammed from "./ages-10-13_scams-and-phishing-what-to-do-if-you-get-scammed.json";
import scams_intro from "./ages-10-13_scams-and-phishing.json";
import screentime from "./ages-10-13_screentime-and-well-being.json";
import sharing_photos from "./ages-10-13_sharing-photos-safely.json";
import think_before_post from "./ages-10-13_think-before-you-post.json";
import two_factor from "./ages-10-13_two-factor-auth.json";
import what_is_cyberbullying_dc from "./ages-10-13_what-is-cyberbullying.json";
import what_is_personal_info from "./ages-10-13_what-is-personal-info.json";
import your_rights from "./ages-10-13_your-rights-online.json";

// Every lesson config in ./configs must be registered here so the bundler
// picks it up (Remotion's bundler does not support Vite's import.meta.glob).
export const LESSON_CONFIGS: LessonConfig[] = [
  internetSafety101,
  fiveWaysToStayPrivate,
  beKindOnline,
  being_a_good_digital_friend,
  catfish_and_fake_profiles,
  cookies_and_tracking,
  creating_strong_passwords,
  cb_building_positive,
  cb_block_report,
  cb_standing_up,
  cb_impact_words,
  cb_what_is,
  digital_footprint,
  location_sharing,
  managing_reputation,
  mean_messages,
  online_vs_offline,
  privacy_settings,
  scams_fake_websites,
  scams_in_game,
  scams_social_media,
  scams_if_scammed,
  scams_intro,
  screentime,
  sharing_photos,
  think_before_post,
  two_factor,
  what_is_cyberbullying_dc,
  what_is_personal_info,
  your_rights,
].map((c) => c as unknown as LessonConfig);
