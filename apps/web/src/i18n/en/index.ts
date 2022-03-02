export default {
  login: 'Login',
  email: 'Email',

  password: 'Password',
  newPassword: 'New Password',
  oldPassword: 'Old Password',
  confirmPassword: 'Confirm password',

  deactivate: 'Deactivate',
  generateNewKey: 'Generate new Key',
  copiedToClipboard: 'Copied to the clipboard.',
  formMaxCount: 'Sorry but you have attempted to submit too many times.',
  language: 'Language',
  success: 'Success!',
  refresh: 'Refresh',
  refreshData: 'Refresh Data',
  paid: 'Paid',
  logout: 'Logout',
  status: 'Status',
  rank: 'Rank',
  confirm: 'Confirm',
  notAllowed: 'Not allowed!',
  reset: 'Reset',
  save: 'Save',
  activate: 'Activate',
  setting: 'Setting | Settings',
  new: 'New',
  edit: 'Edit',
  edited: 'Edited',
  created: 'Created',
  close: 'Close',
  note: 'Note',
  description: 'Description',
  delete: 'Delete',
  deleted: 'Deleted',
  name: 'Name',
  url: 'Url',
  latitude: 'Latitude',
  longitude: 'Longitude',
  profile: 'Profile',
  firstname: 'Firstname',
  lastname: 'Lastname',
  api: 'API',
  credentials: 'Credentials',
  user: 'User',
  error404: 'Oops. Nothing here...',

  soundHint: 'Play sound on notifications.',
  visHint:
    'Send email for Austria VIS deadlines date (Only of interesting for Austrian beekeepers).',
  larvae: 'Larvae',
  hatch: 'Hatch',

  changeStatus: 'Change Status',

  hive: 'Hive | Hives',
  colony: 'Colony | Colonies',
  apiary: 'Apiary | Apiaries',
  newApiary: 'Create Apiary',
  checkup: 'Checkup | Checkups',
  feed: 'Feeding | Feedings',
  harvest: 'Harvest | Harvests',
  treatment: 'Treatment | Treatments',
  rearing: 'Queen rearing | Queen rearings',
  vis: 'VIS (Austria)',
  movedate: 'Migration | Migrations',
  charge: 'Charge Control | Charge Controls',

  todo: "ToDo | ToDo's",
  newTodo: 'New Todo',

  forgot: 'Forgot your password?',
  premiumPartner: 'Our premium supporter:',
  company: 'Company',

  icalUrl: 'ICal Url',
  icalSource: 'ICal Source',

  signup: 'Sign Up',
  signupText: "Don't have an account?",
  signupHintPremium:
    'Hint: When you register, you get one month free premium access to test the entire app. Afterwards you can still use it but with limited functionality.',
  signupSource: 'How did you find us?',
  signupAgree: 'Do you agree with the',
  signupTerms: 'Terms and Conditions',
  signupSuccess:
    'Successfully registered, we send you an e-mail ({msg}) to activate your account.',

  recoverTitle: 'Recover lost password',
  recoverText:
    'Enter the e-mail address by which you registered your user account. You will receive an email with instructions on how to reset your password.',
  recoverSuccess:
    "We send you an e-mail ({msg}) to reset your password, if you dont get the mail in a few minutes it could be that no account with this address is registered. Otherwise please feel free to contact us at {'office@btree.at'}",

  resetTitle: 'Create new password',
  resetSuccess:
    'Your password was successfully changed, we sent a confirmation mail to {msg}.',
  resetLabel: 'Reset Key',

  activateTitle: 'Please confirm your email!',
  activateSuccess: 'Account activated you can now login.',
  activateLabel: 'Confirm Key',

  unsubscribeTitle: 'Unsubscribe',
  unsubscribeSuccess:
    "We removed {msg} from our mailing list, if it is registered. Otherwise please feel free to contact us at {'office@btree.at'}",
  unsubscribeBtn: 'Remove my email.',

  newsletterText:
    'Get notifications per email (eg. premium reminder), no newsletter only if something important changes!',

  profileUserTitle: 'Here you can update your user settings.',
  profileCredentialTitle:
    'Update your login credentials, for security reasons please also insert your old password.',
  profileApiTitle:
    'Premium members can access the API, please see documentation for more information.',

  calendarTitle: 'Calendar',
  calendarHint:
    'On the calendar you can move your events and task. Task can in addition be extended if you grab the event at the end. If you double click on a date you can create new ToDo. If you click on an event you get more info and can set the status.',

  mapHint:
    'You can move your apiary to a new location by drag and drop! Double click on map to create a new apiary!',
  mapRadius: 'Radius',
  mapMove:
    'Are you sure you want to move your apiary ({msg}) to a new location?',

  settingTitle:
    'Here you can select or deselect fields you want to be shown in your Quicktool!',
  settingHintCheckupRating:
    'Rating: 6 Input Fields - Brood, Pollen, Comb Building, Temper, Calm Comb, Swarm',
  settingHintCheckupQueen:
    'Queen: 4 Checkboxes - Queen, Queen Cells, Eggs, Capped Brood',
  settingHintCheckupStrength: 'Strength: 1 Input Field - Strength',
  settingHintCheckupWeight: 'Weight: 1 Input and Time Field for weight value',
  settingHintCheckupTemperature:
    'Temperature: 1 Input Field, for Premium user it will load automatically the current temperature on select hive or apiary',
  settingHintCheckupVarroa: 'Varroa: 1 Input Field for Varroa Count',
  settingHintCheckupFrames:
    'Frames: 4 Input Fields - Broodframes, Honeyframes, Foundationframes, Emptyframes',
  settingHintHarvestWater: 'Water: 1 Input Field for water content %',
  settingHintHarvestFrames:
    'Frames: 1 Input Field for how many frames you harvested.',
  settingHintTreatmentWait:
    'Wait: 1 Input Field, for waiting time after treatment',
  settingHintTreatmentVet:
    'Vet: 1 Dropdown, in the Options you can define the values for this dropdown',
  settingHintChargePrice: 'Price: 1 Input Field, for a price',
  settingHintChargeBestbefore:
    'Best before: 1 Date Field, to be used for best before date',
  settingHintChargeCalibrate:
    'Calibrate: 1 Input Field, if you want to keep a calibrate list for you charges',

  validations: {
    required: 'The field {property} is required.',
    minLengthValue: 'The {property} field must have a min length of {min}.',
    maxLengthValue: 'The {property} field must have a max length of {min}.',
    email: 'Value is not a valid email address.',
    sameAs: 'The value must be equal to the {otherName} value.',
    numeric: 'The value must be numeric.',
    alphaNum: 'The value must be alpha-numeric.',
    betweenValue: 'The value must be between {min} and {max}',
  },
};
