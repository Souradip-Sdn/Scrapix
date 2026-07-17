export type UserRole = "customer" | "partner" | "admin";
export type PickupStatus =
  "pending" | "scheduled" | "collected" | "completed" | "cancelled";
export type PartnerStatus = "not_applied" | "pending" | "approved" | "rejected";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};
