export default {
  activate: 'Activate',
  active: 'Active',
  account: 'Account',
  add: 'Add',
  api: 'API',
  apiary: 'Apiary | Apiaries',
  changeStatus: 'Change Status',
  charge: 'Charge Control | Charge Controls',
  checkup: 'Checkup | Checkups',
  close: 'Close',
  colony: 'Colony | Colonies',
  confirm: 'Confirm',
  confirmPassword: 'Confirm password',
  copiedToClipboard: 'Copied to the clipboard.',
  created: 'Created',
  credentials: 'Credentials',
  date: 'Date',
  dateStart: 'Start date',
  dateEnd: 'End date',
  deactivate: 'Deactivate',
  delete: 'Delete',
  deleted: 'Deleted',
  description: 'Description',
  edit: 'Edit',
  edited: 'Edited',
  email: 'Email',
  error404: 'Oops. Nothing here...',
  feed: 'Feeding | Feedings',
  firstname: 'Firstname',
  forgot: 'Forgot your password?',
  formMaxCount: 'Sorry but you have attempted to submit too many times.',
  generateNewKey: 'Generate new Key',
  harvest: 'Harvest | Harvests',
  hatch: 'Hatch',
  hive: 'Hive | Hives',
  icalSource: 'ICal Source',
  interval: 'Interval',
  intervalText: 'Days between repeats',
  repeat: 'Repeat',
  repeatText: 'Times the task should be repeated',
  icalUrl: 'ICal Url',
  inactive: 'Inactive',
  language: 'Language',
  latest: 'Latest',
  larvae: 'Larvae',
  lastname: 'Lastname',
  lastVisit: 'Last visit',
  latitude: 'Latitude',
  login: 'Login',
  logout: 'Logout',
  longitude: 'Longitude',
  movedate: 'Migration | Migrations',
  name: 'Name',
  new: 'New',
  news: 'News',
  newApiary: 'Create Apiary',
  newPassword: 'New Password',
  newsletterText:
    'Get notifications per email (eg. premium reminder), no newsletter only if something important changes!',
  newTodo: 'New Todo',
  notAllowed: 'Not allowed!',
  note: 'Note',
  oldPassword: 'Old Password',
  paid: 'Paid',
  password: 'Password',
  pending: 'Pending',
  premiumPartner: 'Our premium supporter:',
  rank: 'Rank',
  rearing: 'Queen rearing | Queen rearings',
  refresh: 'Refresh',
  refreshData: 'Refresh Data',
  remove: 'Remove',
  removeAccess: 'Remove access',
  reset: 'Reset',
  save: 'Save',
  search: 'Search',
  soundHint: 'Play sound on notifications.',
  status: 'Status',
  success: 'Success!',
  todo: "ToDo | ToDo's",
  treatment: 'Treatment | Treatments',
  url: 'Url',
  user: 'User | Users',
  version: 'Version',
  vis: 'VIS (Austria)',
  visHint:
    'Send email for Austria VIS deadlines date (Only of interesting for Austrian beekeepers).',

  activateUser: {
    title: 'Please confirm your email!',
    success: 'Account activated you can now login.',
    label: 'Confirm Key',
    notValid:
      "The activation key is not valid anymore. You can also activate your account with the 'Forgot your password' link below.",
  },

  calendar: {
    name: 'Calendar | Calendars',
    hint: 'On the calendar you can move your events and task. Task can in addition be extended if you grab the event at the end. If you double click on a date you can create new ToDo. If you click on an event you get more info and can set the status.',
  },

  company: {
    name: 'Company | Companies',
    title:
      'Here you can change your between your companies or create new ones. As admin you can also edit the name of your company or delete one.',
    titleUser:
      'Here you can see a list of users who have access to the current company. Remove them, change access rights or add new ones.',
    active: 'Your active company',
    changeName: 'Enter a new name for your company (min: 5, max: 45)',
    new: 'Enter name for your new company (min: 5, max: 45). Note: You will need to pay for each new company premium access separately.',
    delete:
      'Are you sure you want to delete the company? This is only possible if it is not your last company and no other users are registered with this company. For security please repeat the name of the company:',
    removeAccess:
      'Are you sure you want to remove your access to this company? This is only possible if you are not the sole user in this company and if it is not your only company. For security please repeat the name of the company:',
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
    userDeleteText:
      'Are you sure you want to delete your account? This action cannot be undone. Note: If there are another user in the current company the company data wont be deleted otherwise all data will be removed. For security please enter your current password.',
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

  quicktool: {
    name: 'Quicktool',
    apiary: 'Select hives based on current apiary location.',
  },

  validations: {
    required: 'The field {property} is required.',
    minLengthValue: 'The {property} field must have a min length of {min}.',
    maxLengthValue: 'The {property} field must have a max length of {min}.',
    minValue: 'The minimum value is {min}.',
    maxValue: 'The maximum value is {max}.',
    integer: 'Value is not an integer.',
    email: 'Value is not a valid email address.',
    sameAs: 'The value must be equal to the {otherName} value.',
    numeric: 'The value must be numeric.',
    alphaNum: 'The value must be alpha-numeric.',
    betweenValue: 'The value must be between {min} and {max}',
  },
};
