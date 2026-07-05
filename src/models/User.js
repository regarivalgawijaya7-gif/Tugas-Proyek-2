import BaseModel from "./BaseModel.js";

export default class User extends BaseModel {
  constructor(data) {
    super(data);
    this.name = data.name;
    this.email = data.email;
    this.role = data.role || "customer";
  }

  canManageEvents() {
    return this.role === "admin";
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      email: this.email,
      role: this.role,
      canManageEvents: this.canManageEvents()
    };
  }
}
