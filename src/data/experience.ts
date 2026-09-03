/* TODO content (plan.md §14): dates and copy carried from the prototype.
   CONFIRM: these read as start dates, but the Woolworths body copy says
   "to December 2025" — presented together that's confusing. */

export interface Role {
  date: string;
  title: string;
  org: string;
  body: string;
}

export const roles: Role[] = [
  {
    date: "MAR 2026",
    title: "IT Support Officer",
    org: "KSB Australia",
    body: "Current. Support for 100+ users, and the internal tooling that sits behind it.",
  },
  {
    date: "SEP 2020",
    title: "Senior Nightfill Team Member",
    org: "Woolworths",
    body: "To December 2025.",
  },
];
