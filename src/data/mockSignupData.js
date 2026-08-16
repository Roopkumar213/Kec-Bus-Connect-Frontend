// College email domain validation constant
export const COLLEGE_EMAIL_DOMAIN = "@kec.ac.in";

// Program configuration rules mapping college types to departments and academic year options
export const PROGRAMS_CONFIG = {
  "Engineering (B.Tech)": {
    collegeType: "Engineering",
    program: "B.Tech",
    departments: [
      "Computer Science and Engineering (CSE)",
      "Computer Science and Engineering (AI & ML)",
      "Computer Science and Engineering (Data Science)",
      "Electronics and Communication Engineering (ECE)",
      "Electrical and Electronics Engineering (EEE)",
      "Mechanical Engineering",
      "Civil Engineering"
    ],
    academicYears: ["1st Year", "2nd Year", "3rd Year", "4th Year"]
  },
  "Degree": {
    collegeType: "Degree",
    program: "Degree",
    departments: [
      "B.Sc Honours (Computer Science)",
      "B.Sc Honours (Chemistry)",
      "B.Com Honours(Computer Applications)",
      "B C A Honours",
      "B B A Honours"
    ],
    academicYears: ["1st Year", "2nd Year", "3rd Year"]
  },
  "Diploma": {
    collegeType: "Diploma",
    program: "Diploma",
    departments: [
      "Computer Science and Engineering (CSE)",
      "Electronics and Communication Engineering (ECE)",
      "Mechanical Engineering",
      "Electrical and Electronics Engineering (EEE)"
    ],
    academicYears: ["1st Year", "2nd Year", "3rd Year"]
  },
  "MBA": {
    collegeType: "MBA",
    program: "MBA",
    departments: [
      "Master of Business Administration (MBA)"
    ],
    academicYears: ["1st Year", "2nd Year"]
  }
};

// Complete List of Official Stops along Attikuppam → KEC (MDR87) route
export const BOARDING_POINTS = [
  "Attikuppam (Origin)",
  "Manendram Village Stop",
  "Balaobanapalle Northern Junction",
  "Singasamudram Center",
  "Kenchanaballa (Loop Terminus)",
  "Singasamudram (Return Pass-through)",
  "Balaobanapalle Junction (Return Axis)",
  "Vijayapuram (Vijalapuram)",
  "Aniganur (Sachivalayam Stop)",
  "Govindapalle",
  "Lingapuram",
  "Ramalagutta Chenu",
  "Kangundhi",
  "Dase Gownur Crossing",
  "Kuppam Town Center",
  "Kuppam Engineering College (KEC - Terminus)",
  "Other / Custom GPS Location"
];

// List of Bus Routes
export const BUS_ROUTES = [
  "Attikuppam → KEC (via MDR87)"
];

// List of Bus Numbers
export const BUS_NUMBERS = [
  "KEC-07"
];
