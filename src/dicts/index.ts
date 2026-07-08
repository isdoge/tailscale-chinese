import { accessControlsDictionary } from "./access-controls";
import { appsDictionary } from "./apps";
import { commonDictionary } from "./common";
import { dnsDictionary } from "./dns";
import { homeDictionary } from "./home";
import { loginDictionary } from "./login";
import { logsDictionary } from "./logs";
import { machinesDictionary } from "./machines";
import { resourceHubDictionary } from "./resource-hub";
import { servicesDictionary } from "./services";
import { settingsBillingDictionary } from "./settings-billing";
import { settingsContactPreferencesDictionary } from "./settings-contact-preferences";
import { settingsDeviceManagementDictionary } from "./settings-device-management";
import { settingsGeneralDictionary } from "./settings-general";
import { settingsKeysDictionary } from "./settings-keys";
import { settingsPolicyFileManagementDictionary } from "./settings-policy-file-management";
import { settingsTrustCredentialsDictionary } from "./settings-trust-credentials";
import { settingsUserManagementDictionary } from "./settings-user-management";
import { settingsWebhooksDictionary } from "./settings-webhooks";
import { usersDictionary } from "./users";
import type { PageDictionary } from "../types";

export const sharedRules = commonDictionary;

export const pageDictionaries: PageDictionary[] = [
  {
    route: /^\/$/,
    rules: homeDictionary,
  },
  {
    route: /^\/login/,
    rules: loginDictionary,
  },
  {
    route: /^\/admin\/machines(?:\/[^/]+)?\/?$/,
    rules: machinesDictionary,
  },
  {
    route: /^\/admin\/apps\/?$/,
    rules: appsDictionary,
  },
  {
    route: /^\/admin\/services(?:\/[^/]+(?:\/[^/]+)*)?\/?$/,
    rules: servicesDictionary,
  },
  {
    route: /^\/admin\/users\/?$/,
    rules: usersDictionary,
  },
  {
    route: /^\/admin\/acls\/(?:visual\/[^/]+(?:\/[^/]+)*|file|diff|preview)\/?$/,
    rules: accessControlsDictionary,
  },
  {
    route: /^\/admin\/logs(?:\/[^/]+)?\/?$/,
    rules: logsDictionary,
  },
  {
    route: /^\/admin\/dns\/?$/,
    rules: dnsDictionary,
  },
  {
    route: /^\/admin\/settings\/general\/?$/,
    rules: settingsGeneralDictionary,
  },
  {
    route: /^\/admin\/settings\/device-management(?:\/[^/]+)*\/?$/,
    rules: settingsDeviceManagementDictionary,
  },
  {
    route: /^\/admin\/settings\/policy-file-management\/?$/,
    rules: settingsPolicyFileManagementDictionary,
  },
  {
    route: /^\/admin\/settings\/trust-credentials(?:\/[^/]+)*\/?$/,
    rules: settingsTrustCredentialsDictionary,
  },
  {
    route: /^\/admin\/settings\/webhooks\/?$/,
    rules: settingsWebhooksDictionary,
  },
  {
    route: /^\/admin\/settings\/contact-preferences\/?$/,
    rules: settingsContactPreferencesDictionary,
  },
  {
    route: /^\/admin\/settings\/billing(?:\/[^/]+)*\/?$/,
    rules: settingsBillingDictionary,
  },
  {
    route: /^\/admin\/settings\/keys(?:\/[^/]+)*\/?$/,
    rules: settingsKeysDictionary,
  },
  {
    route: /^\/admin\/settings\/user-management\/?$/,
    rules: settingsUserManagementDictionary,
  },
  {
    route: /^\/admin\/resource-hub\/?$/,
    rules: resourceHubDictionary,
  },
];
