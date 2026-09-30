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
import young_m1_l1_the_internet_a_big_playground from "./ages-6-9_m1-l1_the-internet-a-big-playground.json";
import young_m1_l2_how_does_the_internet_work from "./ages-6-9_m1-l2_how-does-the-internet-work.json";
import young_m1_l3_websites_and_apps from "./ages-6-9_m1-l3_websites-and-apps.json";
import young_m1_l4_good_vs_bad_content from "./ages-6-9_m1-l4_good-vs-bad-content.json";
import young_m1_l5_screen_time from "./ages-6-9_m1-l5_screen-time.json";
import young_m2_l1_s_stay_safe_online from "./ages-6-9_m2-l1_s-stay-safe-online.json";
import young_m2_l2_m_meeting_people_online from "./ages-6-9_m2-l2_m-meeting-people-online.json";
import young_m2_l3_a_accepting_content from "./ages-6-9_m2-l3_a-accepting-content.json";
import young_m2_l4_r_reliable_information from "./ages-6-9_m2-l4_r-reliable-information.json";
import young_m2_l5_t_tell_an_adult from "./ages-6-9_m2-l5_t-tell-an-adult.json";
import young_m3_l1_kindness_on_the_internet from "./ages-6-9_m3-l1_kindness-on-the-internet.json";
import young_m3_l2_what_is_cyberbullying from "./ages-6-9_m3-l2_what-is-cyberbullying.json";
import young_m3_l3_being_a_good_digital_friend from "./ages-6-9_m3-l3_being-a-good-digital-friend.json";
import young_m3_l4_think_before_you_post from "./ages-6-9_m3-l4_think-before-you-post.json";
import young_m3_l5_dealing_with_mean_messages from "./ages-6-9_m3-l5_dealing-with-mean-messages.json";
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
  young_m1_l1_the_internet_a_big_playground,
  young_m1_l2_how_does_the_internet_work,
  young_m1_l3_websites_and_apps,
  young_m1_l4_good_vs_bad_content,
  young_m1_l5_screen_time,
  young_m2_l1_s_stay_safe_online,
  young_m2_l2_m_meeting_people_online,
  young_m2_l3_a_accepting_content,
  young_m2_l4_r_reliable_information,
  young_m2_l5_t_tell_an_adult,
  young_m3_l1_kindness_on_the_internet,
  young_m3_l2_what_is_cyberbullying,
  young_m3_l3_being_a_good_digital_friend,
  young_m3_l4_think_before_you_post,
  young_m3_l5_dealing_with_mean_messages,
].map((c) => c as unknown as LessonConfig);
