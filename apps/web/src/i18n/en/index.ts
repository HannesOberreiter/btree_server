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
  firstname: 'Firstname',
  lastname: 'Lastname',
  api: 'API',
  credentials: 'Credentials',
  user: 'User | Users',
  error404: 'Oops. Nothing here...',

  soundHint: 'Play sound on notifications.',
  visHint:
    'Send email for Austria VIS deadlines date (Only of interesting for Austrian beekeepers).',
  larvae: 'Larvae',
  hatch: 'Hatch',

  changeStatus: 'Change Status',

  hive: 'Hive | Hives',
  colony: 'Colony | Colonies',
  apiary: 'Apiary | Apiaries',
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

  newsletterText:
    'Get notifications per email (eg. premium reminder), no newsletter only if something important changes!',

  signup: {
    name: 'Sign Up',
    text: "Don't have an account?",
    hintPremium:
      'Hint: When you register, you get one month free premium access to test the entire app. Afterwards you can still use it but with limited functionality.',
    source: 'How did you find us?',
    agree: 'Do you agree with the',
    accept: 'Please accept the terms first!',
    terms: 'Terms and Conditions',
    success:
      'Successfully registered, we send you an e-mail ({msg}) to activate your account.',
  },

  recoverUser: {
    title: 'Recover lost password',
    text: 'Enter the e-mail address by which you registered your user account. You will receive an email with instructions on how to reset your password.',
    success:
      "We send you an e-mail ({msg}) to reset your password, if you dont get the mail in a few minutes it could be that no account with this address is registered. Otherwise please feel free to contact us at {'office@btree.at'}",
  },

  resetUser: {
    title: 'Create new password',
    success:
      'Your password was successfully changed, we sent a confirmation mail to {msg}.',
    label: 'Reset Key',
  },

  activateUser: {
    title: 'Please confirm your email!',
    success: 'Account activated you can now login.',
    label: 'Confirm Key',
    notValid:
      "The activation key is not valid anymore. You can also activate your account with the 'Forgot your password' link below.",
  },

  unsubscribe: {
    name: 'Unsubscribe',
    success:
      "We removed {msg} from our mailing list, if it is registered. Otherwise please feel free to contact us at {'office@btree.at'}",
    btn: 'Remove my email.',
  },

  profile: {
    name: 'Profile | Profiles',
    userTitle: 'Here you can update your user settings.',
    credentialTitle:
      'Update your login credentials, for security reasons please also insert your old password.',
    apiTitle:
      'Premium members can access the API, please see documentation for more information.',
  },

  calendar: {
    name: 'Calendar | Calendars',
    hint: 'On the calendar you can move your events and task. Task can in addition be extended if you grab the event at the end. If you double click on a date you can create new ToDo. If you click on an event you get more info and can set the status.',
  },

  map: {
    name: 'Map | Maps',
    hint: 'You can move your apiary to a new location by drag and drop! Double click on map to create a new apiary!',
    radius: 'Radius',
    move: 'Are you sure you want to move your apiary ({msg}) to a new location?',
  },

  setting: {
    name: 'Setting | Settings',
    title:
      'Here you can select or deselect fields you want to be shown in your Quicktool!',
    hintCheckupRating:
      'Rating: 6 Input Fields - Brood, Pollen, Comb Building, Temper, Calm Comb, Swarm',
    hintCheckupQueen:
      'Queen: 4 Checkboxes - Queen, Queen Cells, Eggs, Capped Brood',
    hintCheckupStrength: 'Strength: 1 Input Field - Strength',
    hintCheckupWeight: 'Weight: 1 Input and Time Field for weight value',
    hintCheckupTemperature:
      'Temperature: 1 Input Field, for Premium user it will load automatically the current temperature on select hive or apiary',
    hintCheckupVarroa: 'Varroa: 1 Input Field for Varroa Count',
    hintCheckupFrames:
      'Frames: 4 Input Fields - Broodframes, Honeyframes, Foundationframes, Emptyframes',
    hintHarvestWater: 'Water: 1 Input Field for water content %',
    hintHarvestFrames:
      'Frames: 1 Input Field for how many frames you harvested.',
    hintTreatmentWait: 'Wait: 1 Input Field, for waiting time after treatment',
    hintTreatmentVet:
      'Vet: 1 Dropdown, in the Options you can define the values for this dropdown',
    hintChargePrice: 'Price: 1 Input Field, for a price',
    hintChargeBestbefore:
      'Best before: 1 Date Field, to be used for best before date',
    hintChargeCalibrate:
      'Calibrate: 1 Input Field, if you want to keep a calibrate list for you charges',
  },

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
